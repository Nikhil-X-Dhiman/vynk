import Dexie, { Table } from 'dexie';

// ============ Interfaces ============

export interface LocalMessage {
  id?: number
  messageId?: string // Server ID
  conversationId: string
  senderId?: string
  content: string
  mediaType?: string | null
  mediaUrl?: string | null
  replyTo?: string | null
  status: 'pending' | 'sent' | 'delivered' | 'seen'
  timestamp: number
}

export interface LocalStory {
  id?: number;
  storyId?: string;
  contentUrl: string;
  expiresAt: number;
}

export interface LocalConversation {
  id?: number;
  conversationId: string; // Server ID
  title?: string;
  type: 'private' | 'group' | 'broadcast';
  groupImg?: string;
  groupBio?: string;
  createdAt: number;
  updatedAt: number;
  lastMessageId?: string;
  lastMessage?: string;
  lastMessageAt?: number | null;
  unreadCount: number;
  // Virtual flag - conversation not yet saved to server
  isVirtual?: boolean;
  // For display purposes (1:1 chats)
  displayName?: string;
  displayAvatar?: string | null;
}

export interface LocalUser {
  id: string; // User ID (primary key)
  name: string;
  avatar: string | null;
  phoneNumber?: string;
  bio?: string;
  updatedAt: number;
}

export interface LocalParticipant {
  id: string; // Compound key: conversationId_userId
  conversationId: string;
  userId: string;
  role: 'member' | 'admin';
  unreadCount: number;
}

export type SyncAction =
  | 'MESSAGE_SEND'
  | 'MESSAGE_READ'
  | 'MESSAGE_DELETE'
  | 'STORY_CREATE'
  | 'STORY_READ'
  | 'STORY_DELETE'
  | 'REACTION_ADD'
  | 'REACTION_REMOVE'
  | 'CONVERSATION_CREATE'
  | 'CONVERSATION_UPDATE'
  | 'CONVERSATION_DELETE';

export interface QueueItem {
  id?: number;
  action: SyncAction;
  payload: any;
  timestamp: number;
}

export interface Meta {
  key: string;
  value: any;
}

// ============ Database Class ============

export class VynkLocalDB extends Dexie {
  messages!: Table<LocalMessage>
  stories!: Table<LocalStory>
  conversations!: Table<LocalConversation>
  queue!: Table<QueueItem>
  meta!: Table<Meta>
  users!: Table<LocalUser>
  participants!: Table<LocalParticipant>

  constructor() {
    super('VynkLocalDB')

    // Version 3: Add participants table and enhance conversations
    this.version(3).stores({
      messages: '++id, messageId, conversationId, timestamp',
      stories: '++id, storyId, expiresAt',
      conversations: '++id, conversationId, updatedAt, type',
      queue: '++id, action, timestamp',
      meta: 'key',
      settings: 'id',
      calls: '++id, status',
      users: 'id, name, updatedAt',
      participants: 'id, conversationId, userId',
    })
  }

  // ============ Story Helpers ============

  async cleanupOldStories() {
    const now = Date.now()
    await this.stories.where('expiresAt').below(now).delete()
  }

  // ============ Queue & Sync ============

  async enqueue(action: SyncAction, payload: any) {
    await this.queue.add({
      action,
      payload,
      timestamp: Date.now(),
    })
    // Trigger sync immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.sync().catch(console.error)
    }
  }

  async sync() {
    if (typeof navigator === 'undefined' || !navigator.onLine) return

    try {
      await this.flushQueue()
      await this.pullDelta()
    } catch (err) {
      console.error('Sync failed', err)
    }
  }

  async flushQueue() {
    const items = await this.queue.orderBy('timestamp').toArray()
    if (items.length === 0) return

    const response = await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(items),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Flush failed')

    const result = await response.json()
    if (result.success) {
      // Clear processed items
      const ids = items.map((i) => i.id!)
      await this.queue.bulkDelete(ids)
    }
  }

  async pullDelta() {
    const meta = await this.meta.get('lastSyncedAt')
    const lastSyncedAt = meta?.value || new Date(0).toISOString()

    const response = await fetch(`/api/sync?since=${lastSyncedAt}`)
    if (!response.ok) throw new Error('Pull failed')

    const data = await response.json()

    // Apply changes - using individual updates instead of large transaction
    // 1. Apply Conversation Changes
    if (data.conversations?.length) {
      await this.syncConversations(data.conversations)
    }

    // 2. Apply Message Changes
    if (data.messages?.length) {
      await this.syncMessages(data.messages)
    }

    // 3. Apply Story Changes
    if (data.stories?.length) {
      await this.syncStories(data.stories)
    }

    // 4. Apply User Changes
    if (data.users?.length) {
      await this.syncUsers(data.users)
    }

    // 5. Handle Deletions
    if (data.deletedMessageIds?.length) {
      await this.messages
        .where('messageId')
        .anyOf(data.deletedMessageIds)
        .delete()
    }
    if (data.deletedStoryIds?.length) {
      await this.stories.where('storyId').anyOf(data.deletedStoryIds).delete()
    }
    if (data.deletedConversationIds?.length) {
      await this.conversations
        .where('conversationId')
        .anyOf(data.deletedConversationIds)
        .delete()
    }

    // 6. Update Timestamp
    await this.meta.put({ key: 'lastSyncedAt', value: data.timestamp })
  }

  // ============ Sync Helpers ============

  async syncUsers(users: LocalUser[]) {
    for (const user of users) {
      await this.users.put(user)
    }
  }

  async syncConversations(conversations: Partial<LocalConversation>[]) {
    for (const conv of conversations) {
      const existing = await this.conversations
        .where('conversationId')
        .equals(conv.conversationId!)
        .first()

      if (existing) {
        await this.conversations.update(existing.id!, {
          ...conv,
          isVirtual: false, // Mark as persisted
        })
      } else {
        await this.conversations.add({
          ...conv,
          isVirtual: false,
        } as LocalConversation)
      }
    }
  }

  async syncMessages(messages: Partial<LocalMessage>[]) {
    for (const msg of messages) {
      if (!msg.messageId) continue

      const existing = await this.messages
        .where('messageId')
        .equals(msg.messageId)
        .first()

      if (existing) {
        await this.messages.update(existing.id!, msg)
      } else {
        await this.messages.add(msg as LocalMessage)
      }
    }
  }

  async syncStories(stories: Partial<LocalStory>[]) {
    for (const story of stories) {
      if (!story.storyId) continue

      const existing = await this.stories
        .where('storyId')
        .equals(story.storyId)
        .first()

      if (existing) {
        await this.stories.update(existing.id!, story)
      } else {
        await this.stories.add(story as LocalStory)
      }
    }
  }

  async syncParticipants(participants: LocalParticipant[]) {
    for (const participant of participants) {
      await this.participants.put(participant)
    }
  }

  // ============ Initial Sync ============

  async performInitialSync() {
    try {
      const response = await fetch('/api/initial-sync')
      if (!response.ok) throw new Error('Initial sync failed')

      const data = await response.json()
      console.log('Initial sync data', data)
      // 1. Store users
      if (data.users?.length) {
        await this.users.bulkPut(data.users)
      }

      // 2. Store conversations and participants
      if (data.conversations?.length) {
        for (const conv of data.conversations) {
          // Store conversation
          const convData: LocalConversation = {
            conversationId: conv.conversationId,
            title: conv.title,
            type: conv.type,
            groupImg: conv.groupImg,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: conv.unreadCount,
            isVirtual: false,
            displayName: conv.title,
            displayAvatar: conv.groupImg,
          }
          await this.conversations.put(convData)

          // Store participants
          if (conv.participants?.length) {
            for (const p of conv.participants) {
              await this.participants.put({
                id: p.odId,
                conversationId: p.odConversationId,
                userId: p.odUserId,
                role: p.role,
                unreadCount: p.unreadCount,
              })
            }
          }
        }
      }

      // 3. Store messages
      if (data.messages?.length) {
        const messagesToStore = data.messages.map((m: any) => ({
          messageId: m.messageId,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          replyTo: m.replyTo,
          status: m.status,
          timestamp: m.timestamp,
        }))
        await this.messages.bulkPut(messagesToStore)
      }

      // 4. Update sync timestamp
      await this.meta.put({ key: 'lastSyncedAt', value: data.timestamp })
      await this.meta.put({ key: 'initialSyncCompleted', value: true })

      return { success: true }
    } catch (error) {
      console.error('Initial sync error:', error)
      return { success: false, error }
    }
  }

  async isInitialSyncCompleted(): Promise<boolean> {
    const meta = await this.meta.get('initialSyncCompleted')
    return meta?.value === true
  }

  // ============ Conversation Helpers ============

  /**
   * Get display name for a conversation (handles 1:1 chats)
   */
  async getConversationDisplayInfo(
    conversationId: string,
    currentUserId: string,
  ): Promise<{ name: string; avatar: string | null }> {
    const conv = await this.conversations
      .where('conversationId')
      .equals(conversationId)
      .first()

    if (!conv) {
      return { name: 'Unknown', avatar: null }
    }

    if (conv.type === 'group') {
      return { name: conv.title || 'Group', avatar: conv.groupImg || null }
    }

    // For private chats, get the other participant's info
    const participants = await this.participants
      .where('conversationId')
      .equals(conversationId)
      .toArray()

    const otherParticipant = participants.find(
      (p) => p.userId !== currentUserId,
    )

    if (otherParticipant) {
      const user = await this.users.get(otherParticipant.userId)
      if (user) {
        return { name: user.name, avatar: user.avatar }
      }
    }

    // Self-chat: only participant is the current user
    if (participants.length === 1 && participants[0].userId === currentUserId) {
      const self = await this.users.get(currentUserId)
      return { name: 'You', avatar: self?.avatar ?? null }
    }

    return { name: conv.title || 'Unknown', avatar: null }
  }

  /**
   * Creates or finds a conversation with a target user.
   * Supports self-chat (targetUserId === currentUserId).
   * Uses UUIDv7 for new conversations so the same ID works locally and on the server.
   *
   * @returns conversationId and whether it was newly created, or null if target user not found.
   */
  async createLocalConversation(
    targetUserId: string,
    currentUserId: string,
  ): Promise<{ conversationId: string; isNew: boolean } | null> {
    const targetUser = await this.users.get(targetUserId)
    if (!targetUser) return null

    const isSelfChat = targetUserId === currentUserId

    if (isSelfChat) {
      // Check for an existing self-conversation (single participant = self)
      const myParticipants = await this.participants
        .where('userId')
        .equals(currentUserId)
        .toArray()

      for (const p of myParticipants) {
        const allInConv = await this.participants
          .where('conversationId')
          .equals(p.conversationId)
          .toArray()

        if (allInConv.length === 1 && allInConv[0].userId === currentUserId) {
          return { conversationId: p.conversationId, isNew: false }
        }
      }

      // No existing self-conversation — create one
      const { v7: uuidv7 } = await import('uuid')
      const conversationId = uuidv7()

      await this.conversations.add({
        conversationId,
        title: 'You',
        type: 'private',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unreadCount: 0,
        isVirtual: true,
        displayName: 'You',
        displayAvatar: targetUser.avatar,
      })

      await this.participants.add({
        id: `${conversationId}_${currentUserId}`,
        conversationId,
        userId: currentUserId,
        role: 'member',
        unreadCount: 0,
      })

      return { conversationId, isNew: true }
    }

    // --- Normal two-user conversation ---

    // Check if a private conversation already exists between these two users
    const targetParticipants = await this.participants
      .where('userId')
      .equals(targetUserId)
      .toArray()

    for (const tp of targetParticipants) {
      const currentUserParticipant = await this.participants
        .where('conversationId')
        .equals(tp.conversationId)
        .filter((p) => p.userId === currentUserId)
        .first()

      if (currentUserParticipant) {
        // Conversation already exists — return it
        return { conversationId: tp.conversationId, isNew: false }
      }
    }

    // No existing conversation — create with UUIDv7
    const { v7: uuidv7 } = await import('uuid')
    const conversationId = uuidv7()

    await this.conversations.add({
      conversationId,
      title: targetUser.name,
      type: 'private',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadCount: 0,
      isVirtual: true,
      displayName: targetUser.name,
      displayAvatar: targetUser.avatar,
    })

    // Add participants locally
    await this.participants.bulkAdd([
      {
        id: `${conversationId}_${currentUserId}`,
        conversationId,
        userId: currentUserId,
        role: 'member',
        unreadCount: 0,
      },
      {
        id: `${conversationId}_${targetUserId}`,
        conversationId,
        userId: targetUserId,
        role: 'member',
        unreadCount: 0,
      },
    ])

    return { conversationId, isNew: true }
  }

  /**
   * Marks a local conversation as persisted on the server.
   * Since we use UUIDv7 from the start, the ID never changes.
   */
  async persistConversation(conversationId: string): Promise<void> {
    const conv = await this.conversations
      .where('conversationId')
      .equals(conversationId)
      .first()

    if (!conv) return

    await this.conversations.update(conv.id!, { isVirtual: false })
  }

  // ============ Clear Data ============

  async clearAllData() {
    await this.messages.clear()
    await this.stories.clear()
    await this.conversations.clear()
    await this.users.clear()
    await this.participants.clear()
    await this.queue.clear()
    await this.meta.clear()
  }
}

export const db = new VynkLocalDB();
