import {
  LocalConversation,
  LocalMessage,
  LocalStory,
  LocalUser,
  LocalParticipant,
} from './types'
import type { VynkLocalDB } from './core'

// ============ Sync Logic (Pull Only) ============

/**
 * Pulls delta updates from the server and applies them to local DB.
 * Only fetches data changed since the last sync timestamp.
 */
export async function pullDelta(db: VynkLocalDB) {
  if (typeof navigator === 'undefined' || !navigator.onLine) return

  const meta = await db.meta.get('lastSyncedAt')
  const lastSyncedAt = meta?.value || new Date(0).toISOString()

  const response = await fetch(`/api/sync?since=${lastSyncedAt}`)
  if (!response.ok) throw new Error('Pull failed')

  const data = await response.json()

  // Apply changes
  if (data.conversations?.length) {
    await syncConversations(db, data.conversations)
  }

  if (data.messages?.length) {
    await syncMessages(db, data.messages)
  }

  if (data.stories?.length) {
    await syncStories(db, data.stories)
  }

  if (data.users?.length) {
    await syncUsers(db, data.users)
  }

  // Handle Deletions
  if (data.deletedMessageIds?.length) {
    await db.messages.where('messageId').anyOf(data.deletedMessageIds).delete()
  }
  if (data.deletedStoryIds?.length) {
    await db.stories.where('storyId').anyOf(data.deletedStoryIds).delete()
  }
  if (data.deletedConversationIds?.length) {
    await db.conversations
      .where('conversationId')
      .anyOf(data.deletedConversationIds)
      .delete()
  }

  // Update Timestamp
  await db.meta.put({ key: 'lastSyncedAt', value: data.timestamp })
}

// ============ Sync Helpers ============

export async function syncUsers(db: VynkLocalDB, users: LocalUser[]) {
  for (const user of users) {
    await db.users.put(user)
  }
}

export async function syncConversations(
  db: VynkLocalDB,
  conversations: Partial<LocalConversation>[],
) {
  for (const conv of conversations) {
    if (!conv.conversationId) continue

    const existing = await db.conversations
      .where('conversationId')
      .equals(conv.conversationId)
      .first()

    if (existing) {
      await db.conversations.update(existing.id!, {
        ...conv,
        isVirtual: false, // Mark as persisted
      })
    } else {
      await db.conversations.add({
        ...conv,
        isVirtual: false,
      } as LocalConversation)
    }
  }
}

export async function syncMessages(
  db: VynkLocalDB,
  messages: Partial<LocalMessage>[],
) {
  for (const msg of messages) {
    if (!msg.messageId) continue

    const existing = await db.messages
      .where('messageId')
      .equals(msg.messageId)
      .first()

    if (existing) {
      await db.messages.update(existing.id!, msg)
    } else {
      await db.messages.add(msg as LocalMessage)
    }
  }
}

export async function syncStories(
  db: VynkLocalDB,
  stories: Partial<LocalStory>[],
) {
  for (const story of stories) {
    if (!story.storyId) continue

    const existing = await db.stories
      .where('storyId')
      .equals(story.storyId)
      .first()

    if (existing) {
      await db.stories.update(existing.id!, story)
    } else {
      await db.stories.add(story as LocalStory)
    }
  }
}

export async function syncParticipants(
  db: VynkLocalDB,
  participants: LocalParticipant[],
) {
  for (const participant of participants) {
    await db.participants.put(participant)
  }
}

// ============ Initial Sync ============

export async function performInitialSync(db: VynkLocalDB) {
  try {
    const response = await fetch('/api/initial-sync')
    if (!response.ok) throw new Error('Initial sync failed')

    const data = await response.json()
    if (!data.success) throw new Error(data.error || 'Initial sync failed')

    // 1. Store users
    if (data.users?.length) {
      const usersToStore: LocalUser[] = data.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatarUrl,
        phoneNumber: u.phoneNumber,
        bio: u.bio,
        updatedAt: new Date(u.updatedAt).getTime(),
      }))
      await db.users.bulkPut(usersToStore)
    }

    // 2. Store participants
    if (data.participants?.length) {
      const participantsToStore: LocalParticipant[] = data.participants.map(
        (p: any) => ({
          id: p.id,
          conversationId: p.conversationId,
          userId: p.userId,
          role: p.role,
          unreadCount: p.unreadCount || 0,
        }),
      )
      await db.participants.bulkPut(participantsToStore)
    }

    // Build lookup maps for enrichment
    const userMap = new Map<string, any>(
      data.users?.map((u: any) => [u.id, u]) || [],
    )
    const msgMap = new Map<string, any>(
      data.messages?.map((m: any) => [m.id, m]) || [],
    )
    const participantMap = new Map<string, any[]>()

    if (data.participants) {
      for (const p of data.participants) {
        if (!participantMap.has(p.conversationId)) {
          participantMap.set(p.conversationId, [])
        }
        participantMap.get(p.conversationId)?.push(p)
      }
    }

    // 3. Store conversations
    if (data.conversations?.length) {
      const conversationsToStore: LocalConversation[] = data.conversations.map(
        (c: any) => {
          const parts = participantMap.get(c.id) || []
          const myPart = parts.find((p: any) => p.userId === data.currentUserId)

          // Resolve proper display name for 1:1 chats
          let displayName = c.name
          let displayAvatar = c.groupImg

          if (c.conversationType === 'private') {
            const otherPart = parts.find(
              (p: any) => p.userId !== data.currentUserId,
            )
            if (otherPart) {
              const otherUser = userMap.get(otherPart.userId)
              if (otherUser) {
                displayName = otherUser.name
                displayAvatar = otherUser.avatarUrl
              }
            } else if (
              parts.length === 1 &&
              parts[0].userId === data.currentUserId
            ) {
              // Self chat
              displayName = 'You'
              const me = userMap.get(data.currentUserId)
              if (me) displayAvatar = me.avatarUrl
            }
          }

          // Resolve last message
          const lastMsg = c.lastMessageId ? msgMap.get(c.lastMessageId) : null

          return {
            conversationId: c.id,
            title: c.name,
            type: c.conversationType,
            groupImg: c.groupImg,
            createdAt: new Date(c.updatedAt).getTime(),
            updatedAt: new Date(c.updatedAt).getTime(),
            lastMessageId: c.lastMessageId,
            lastMessage: lastMsg?.content || undefined,
            lastMessageAt: lastMsg
              ? new Date(lastMsg.createdAt).getTime()
              : new Date(c.updatedAt).getTime(),
            unreadCount: myPart?.unreadCount || 0,
            isVirtual: false,
            displayName: displayName || 'Unknown',
            displayAvatar: displayAvatar || null,
          } as LocalConversation
        },
      )
      await db.conversations.bulkPut(conversationsToStore)
    }

    // 4. Store messages
    if (data.messages?.length) {
      const messagesToStore: LocalMessage[] = data.messages.map((m: any) => ({
        messageId: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content || '',
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl,
        replyTo: m.replyTo,
        status: 'seen', // Historical messages are typically seen
        timestamp: new Date(m.createdAt).getTime(),
      }))
      await db.messages.bulkPut(messagesToStore)
    }

    // 5. Update sync timestamp
    await db.meta.put({ key: 'lastSyncedAt', value: data.timestamp })
    await db.meta.put({ key: 'initialSyncCompleted', value: true })

    return { success: true }
  } catch (error) {
    console.error('[InitialSync] Error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function isInitialSyncCompleted(
  db: VynkLocalDB,
): Promise<boolean> {
  const meta = await db.meta.get('initialSyncCompleted')
  return meta?.value === true
}
