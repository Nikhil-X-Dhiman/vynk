import { db } from '../../kysely/db'
import { getUsersDelta } from '../user'
import { sendMessage } from '../message'
import { createConversation } from '../conversation'
import { markAsRead } from '../participant'

export interface SyncMessage {
  messageId: string
  conversationId: string
  senderId: string
  content: string
  mediaType: string | null
  mediaUrl: string | null
  replyTo: string | null
  status: 'sent' | 'delivered' | 'seen'
  timestamp: number
  updatedAt: number
}

export interface SyncUser {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  updatedAt: number
}

export interface SyncConversation {
  conversationId: string
  title: string
  type: 'private' | 'group' | 'broadcast'
  groupImg: string
  groupBio: string
  createdAt: number
  updatedAt: number
  unreadCount: number
}

export interface SyncDeltaResponse {
  messages: SyncMessage[]
  users: SyncUser[]
  conversations: SyncConversation[]
  deletedMessageIds: string[]
  deletedConversationIds: string[]
  timestamp: string
}

/**
 * Represents a queued offline action to be processed.
 */
export interface QueueItem {
  id: number
  action: string
  payload: Record<string, any>
  timestamp: number
}

/**
 * Fetches all changed data since the last synchronization point for a user.
 *
 * @param userId - ID of the user requesting the sync
 * @param since - Date since last successful sync
 * @returns Sync delta response containing changed and deleted items
 */
export async function getSyncDelta(
  userId: string,
  since: Date,
): Promise<SyncDeltaResponse> {
  // Fetch all user's conversation IDs for filtering messages
  const userConversationIds = await db
    .selectFrom('participant')
    .select('conversation_id')
    .where('user_id', '=', userId)
    .execute()
    .then((rows) => rows.map((r) => r.conversation_id))

  const [messages, deletedMessages, conversations, deletedConvs, usersResult] =
    await Promise.all([
      // Changed messages in user's conversations
      userConversationIds.length > 0
        ? db
            .selectFrom('message')
            .selectAll()
            .where('updated_at', '>', since)
            .where('is_deleted', '=', false)
            .where('conversation_id', 'in', userConversationIds)
            .execute()
        : Promise.resolve([]),

      // Deleted message IDs in user's conversations
      userConversationIds.length > 0
        ? db
            .selectFrom('message')
            .select('id')
            .where('updated_at', '>', since)
            .where('is_deleted', '=', true)
            .where('conversation_id', 'in', userConversationIds)
            .execute()
        : Promise.resolve([]),

      // Changed conversations the user participates in
      userConversationIds.length > 0
        ? db
            .selectFrom('conversation')
            .selectAll()
            .where('updated_at', '>', since)
            .where('is_deleted', '=', false)
            .where('id', 'in', userConversationIds)
            .execute()
        : Promise.resolve([]),

      // Deleted conversation IDs
      userConversationIds.length > 0
        ? db
            .selectFrom('conversation')
            .select('id')
            .where('updated_at', '>', since)
            .where('is_deleted', '=', true)
            .where('id', 'in', userConversationIds)
            .execute()
        : Promise.resolve([]),

      // Changed users
      getUsersDelta({ since, excludeUserId: userId }),
    ])

  const users = usersResult.success ? usersResult.data : []

  return {
    messages: messages.map((m) => ({
      messageId: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content ?? '',
      mediaType: m.media_type ?? null,
      mediaUrl: m.media_url ?? null,
      replyTo: m.reply_to ?? null,
      status: 'sent' as const,
      timestamp: new Date(m.created_at).getTime(),
      updatedAt: new Date(m.updated_at).getTime(),
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatarUrl,
      bio: u.bio ?? null,
      updatedAt: new Date(u.updatedAt).getTime(),
    })),
    conversations: conversations.map((c) => ({
      conversationId: c.id,
      title: c.title ?? '',
      type: (c.type as 'private' | 'group' | 'broadcast') ?? 'private',
      groupImg: c.group_img ?? '',
      groupBio: c.group_bio ?? '',
      createdAt: new Date(c.created_at).getTime(),
      updatedAt: new Date(c.updated_at).getTime(),
      unreadCount: 0,
    })),
    deletedMessageIds: deletedMessages.map((m) => m.id),
    deletedConversationIds: deletedConvs.map((c) => c.id),
    timestamp: new Date().toISOString(),
  }
}

export interface BatchProcessingResult {
  queueId: number
  success: boolean
  error?: string
  data?: any
}

/**
 * Processes a batch of queued offline actions.
 *
 * @param userId - ID of the user performing the sync
 * @param items - List of queued actions
 * @returns Array of results for each item
 */
export async function processSyncBatch(
  userId: string,
  items: QueueItem[],
): Promise<BatchProcessingResult[]> {
  const results: BatchProcessingResult[] = []

  for (const item of items) {
    try {
      let success = false
      let data: any = undefined
      let error: string | undefined

      switch (item.action) {
        case 'MESSAGE_SEND': {
          const payload = item.payload
          const result = await sendMessage({
            id: payload.id as string,
            conversationId: payload.conversationId as string,
            senderId: userId,
            content: payload.content as string,
            mediaType: payload.mediaType as any,
            mediaUrl: payload.mediaUrl as string,
            replyTo: payload.replyTo as string,
          })

          if (result.success) {
            success = true
            data = result.data
          } else {
            error = result.error
          }
          break
        }

        case 'CONVERSATION_CREATE': {
          const payload = item.payload
          const participantIds = (payload.participantIds as string[]) || []

          // Ensure current user is included
          if (!participantIds.includes(userId)) {
            participantIds.push(userId)
          }

          const result = await createConversation({
            id: payload.conversationId as string,
            type:
              (payload.type as 'private' | 'group' | 'broadcast') || 'private',
            title: (payload.title as string) || 'New Conversation',
            createdByUserId: userId,
            groupImg: payload.groupImg as string,
            participantInfo: participantIds.map((pid) => ({
              userId: pid,
              role: 'member',
            })),
          })

          if (result.success) {
            success = true
            data = result.data
          } else {
            error = result.error
          }
          break
        }

        case 'MESSAGE_READ': {
          const payload = item.payload
          const conversationId = payload.conversationId as string
          let messageId = payload.messageId as string | undefined

          if (!conversationId) {
            error = 'Missing conversationId'
            break
          }

          // If messageId not provided, find the latest message in conversation
          if (!messageId) {
            const latestMsg = await db
              .selectFrom('message')
              .select('id')
              .where('conversation_id', '=', conversationId)
              .orderBy('created_at', 'desc')
              .executeTakeFirst()

            if (latestMsg) {
              messageId = latestMsg.id
            }
          }

          if (messageId) {
            const result = await markAsRead({
              conversationId,
              userId,
              lastReadMessageId: messageId,
            })

            if (result.success) {
              success = true
            } else {
              error = result.error
            }
          } else {
            // No messages to read? Mark success anyway to clear queue
            success = true
          }
          break
        }

        default:
          console.warn(`Unknown sync action: ${item.action}`)
          success = true // Mark as success to remove from queue to avoid infinite retries
          break
      }

      results.push({
        queueId: item.id,
        success,
        error,
        data,
      })
    } catch (e) {
      console.error(`Error processing sync item ${item.id}:`, e)
      results.push({
        queueId: item.id,
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      })
    }
  }

  return results
}
