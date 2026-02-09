/**
 * @fileoverview Sync Service for offline-first data synchronization.
 *
 * Provides delta sync capabilities for fetching changed data since the last
 * synchronization point, and batch processing of queued offline actions.
 *
 * @module lib/db/sync
 */

import { db, getUsersDelta } from '@repo/db';

// ==========================================
// Constants
// ==========================================

/** Batch processing action constants */
const SyncAction = {
  // Message actions
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_UPDATE: 'MESSAGE_UPDATE',
  MESSAGE_DELETE: 'MESSAGE_DELETE',

  // Story actions
  STORY_CREATE: 'STORY_CREATE',
  STORY_DELETE: 'STORY_DELETE',
  STORY_VIEW: 'STORY_VIEW',

  // Reaction actions
  REACTION_ADD: 'REACTION_ADD',
  REACTION_REMOVE: 'REACTION_REMOVE',

  // Delivery actions
  DELIVERY_UPDATE: 'DELIVERY_UPDATE',

  // Conversation actions
  CONVERSATION_CREATE: 'CONVERSATION_CREATE',
  CONVERSATION_UPDATE: 'CONVERSATION_UPDATE',
  CONVERSATION_DELETE: 'CONVERSATION_DELETE',

  // Participant actions
  PARTICIPANT_ADD: 'PARTICIPANT_ADD',
  PARTICIPANT_REMOVE: 'PARTICIPANT_REMOVE',
  MARK_AS_READ: 'MARK_AS_READ',
} as const;

type SyncActionType = (typeof SyncAction)[keyof typeof SyncAction];

// ==========================================
// Types
// ==========================================

/**
 * Represents a synchronized message in the delta response.
 */
export interface SyncMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaType: string | null;
  mediaUrl: string | null;
  replyTo: string | null;
  status: 'sent' | 'delivered' | 'seen';
  timestamp: number;
  updatedAt: number;
}

/**
 * Represents a synchronized story in the delta response.
 */
export interface SyncStory {
  storyId: string;
  userId: string;
  contentUrl: string;
  caption: string | null;
  text: string | null;
  type: string | null;
  expiresAt: number;
  createdAt: number;
}

/**
 * Represents a synchronized user in the delta response.
 */
export interface SyncUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  updatedAt: number;
}

/**
 * Represents a synchronized conversation in the delta response.
 */
export interface SyncConversation {
  conversationId: string;
  title: string;
  type: 'private' | 'group' | 'broadcast';
  groupImg: string;
  groupBio: string;
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
}

/**
 * Complete sync delta response containing all changed entities.
 */
export interface SyncDeltaResponse {
  messages: SyncMessage[];
  stories: SyncStory[];
  users: SyncUser[];
  conversations: SyncConversation[];
  deletedMessageIds: string[];
  deletedStoryIds: string[];
  deletedConversationIds: string[];
  timestamp: string;
}

/**
 * Represents a queued offline action to be processed.
 */
export interface QueueItem {
  /** Unique identifier for the queue item (required for result mapping) */
  id: number;
  /** Action type to perform */
  action: SyncActionType | string;
  /** Action-specific payload data */
  payload: Record<string, unknown>;
  /** Client timestamp when the action was queued */
  timestamp: number;
}

/**
 * Result of processing a single batch item.
 */
export interface BatchProcessingResult {
  /** Queue item ID */
  id: number;
  /** Processing status */
  status: 'success' | 'failed';
  /** Error message if failed */
  error?: string;
}

// ==========================================
// Public Methods
// ==========================================

/**
 * Fetches all changed data since the last synchronization point.
 *
 * Retrieves delta changes for messages, stories, users, and conversations
 * that have been modified after the specified timestamp. Also returns IDs
 * of deleted entities for client-side cleanup.
 *
 * @param userId - ID of the user requesting the sync
 * @param since - Date since last successful sync
 * @returns Promise resolving to delta changes grouped by entity type
 *
 * @example
 * ```ts
 * const lastSync = new Date(localStorage.getItem('lastSyncTime'));
 * const delta = await getSyncDelta(userId, lastSync);
 *
 * // Apply changes to local database
 * await localDb.messages.bulkPut(delta.messages);
 * await localDb.messages.bulkDelete(delta.deletedMessageIds);
 * ```
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
    .then((rows) => rows.map((r) => r.conversation_id));

  const [
    messages,
    stories,
    deletedMessages,
    deletedStories,
    conversations,
    deletedConvs,
    usersResult,
  ] = await Promise.all([
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

    // Changed stories (visible to user)
    db
      .selectFrom('story')
      .selectAll()
      .where('updated_at', '>', since)
      .where('is_deleted', '=', false)
      .execute(),

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

    // Deleted story IDs
    db
      .selectFrom('story')
      .select('id')
      .where('updated_at', '>', since)
      .where('is_deleted', '=', true)
      .execute(),

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
  ]);

  const users = usersResult.success ? usersResult.data : [];

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
    stories: stories.map((s) => ({
      storyId: s.id,
      userId: s.user_id,
      contentUrl: s.content_url ?? '',
      caption: s.caption ?? null,
      text: s.text ?? null,
      type: s.type ?? null,
      expiresAt: s.expires_at ? new Date(s.expires_at).getTime() : 0,
      createdAt: new Date(s.created_at).getTime(),
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
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
    deletedStoryIds: deletedStories.map((s) => s.id),
    deletedConversationIds: deletedConvs.map((c) => c.id),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Processes a batch of queued offline actions.
 *
 * Executes each action in sequence, handling failures gracefully and
 * returning individual results for each item. Supports all CRUD operations
 * for messages, stories, reactions, deliveries, conversations, and participants.
 *
 * @param userId - ID of the user performing the actions
 * @param items - Array of queued actions to process
 * @returns Promise resolving to array of processing results
 *
 * @example
 * ```ts
 * const queuedActions = await localDb.syncQueue.toArray();
 * const results = await processSyncBatch(userId, queuedActions);
 *
 * // Remove successfully processed items from queue
 * const successIds = results
 *   .filter(r => r.status === 'success')
 *   .map(r => r.id);
 * await localDb.syncQueue.bulkDelete(successIds);
 * ```
 */
export async function processSyncBatch(
  userId: string,
  items: QueueItem[],
): Promise<BatchProcessingResult[]> {
  const results: BatchProcessingResult[] = [];

  for (const item of items) {
    const { id, action, payload } = item;

    try {
      await processAction(userId, action, payload);
      results.push({ id, status: 'success' });
    } catch (error) {
      console.error(`[Sync] Failed to process item ${id}:`, error);
      results.push({
        id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

// ==========================================
// Action Handlers
// ==========================================

/**
 * Routes and executes a sync action based on its type.
 *
 * @param userId - ID of the user performing the action
 * @param action - Action type to execute
 * @param payload - Action-specific payload data
 * @throws Error if action fails or is unsupported
 */
async function processAction(
  userId: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (action) {
    // ========== Message Actions ==========
    case SyncAction.MESSAGE_SEND:
      await handleMessageSend(userId, payload);
      break;

    case SyncAction.MESSAGE_UPDATE:
      await handleMessageUpdate(userId, payload);
      break;

    case SyncAction.MESSAGE_DELETE:
      await handleMessageDelete(userId, payload);
      break;

    // ========== Story Actions ==========
    case SyncAction.STORY_CREATE:
      await handleStoryCreate(userId, payload);
      break;

    case SyncAction.STORY_DELETE:
      await handleStoryDelete(userId, payload);
      break;

    case SyncAction.STORY_VIEW:
      await handleStoryView(userId, payload);
      break;

    // ========== Reaction Actions ==========
    case SyncAction.REACTION_ADD:
      await handleReactionAdd(userId, payload);
      break;

    case SyncAction.REACTION_REMOVE:
      await handleReactionRemove(userId, payload);
      break;

    // ========== Delivery Actions ==========
    case SyncAction.DELIVERY_UPDATE:
      await handleDeliveryUpdate(userId, payload);
      break;

    // ========== Conversation Actions ==========
    case SyncAction.CONVERSATION_CREATE:
      await handleConversationCreate(userId, payload);
      break;

    case SyncAction.CONVERSATION_UPDATE:
      await handleConversationUpdate(userId, payload);
      break;

    case SyncAction.CONVERSATION_DELETE:
      await handleConversationDelete(userId, payload);
      break;

    // ========== Participant Actions ==========
    case SyncAction.PARTICIPANT_ADD:
      await handleParticipantAdd(userId, payload);
      break;

    case SyncAction.PARTICIPANT_REMOVE:
      await handleParticipantRemove(userId, payload);
      break;

    case SyncAction.MARK_AS_READ:
      await handleMarkAsRead(userId, payload);
      break;

    default:
      console.warn(`[Sync] Unknown action type: ${action}`);
  }
}

// ========== Message Handlers ==========

async function handleMessageSend(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = (payload.messageId ?? payload.id) as string;
  const conversationId = payload.conversationId as string;
  const content = (payload.content ?? '') as string;
  const mediaType = payload.mediaType as string | undefined;
  const mediaUrl = payload.mediaUrl as string | undefined;
  const replyTo = payload.replyTo as string | undefined;
  const timestamp = (payload.timestamp as number) ?? Date.now();

  await db
    .insertInto('message')
    .values({
      id: messageId,
      conversation_id: conversationId,
      sender_id: userId,
      content,
      media_type: mediaType as 'text' | 'image' | 'video' | 'file' | undefined,
      media_url: mediaUrl,
      reply_to: replyTo,
      created_at: new Date(timestamp),
      updated_at: new Date(),
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

async function handleMessageUpdate(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = payload.messageId as string;
  const content = payload.content as string | undefined;

  await db
    .updateTable('message')
    .set({
      ...(content !== undefined && { content }),
      updated_at: new Date(),
    })
    .where('id', '=', messageId)
    .where('sender_id', '=', userId)
    .execute();
}

async function handleMessageDelete(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = payload.messageId as string;

  await db
    .updateTable('message')
    .set({ is_deleted: true, updated_at: new Date() })
    .where('id', '=', messageId)
    .where('sender_id', '=', userId)
    .execute();
}

// ========== Story Handlers ==========

async function handleStoryCreate(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const storyId = (payload.storyId ?? payload.id) as string;
  const contentUrl = (payload.contentUrl ?? '') as string;
  const caption = payload.caption as string | undefined;
  const text = payload.text as string | undefined;
  const type = payload.type as 'text' | 'image' | 'video' | 'file' | undefined;
  const expiresAt = payload.expiresAt as number | undefined;

  await db
    .insertInto('story')
    .values({
      id: storyId,
      user_id: userId,
      content_url: contentUrl || null,
      caption: caption || null,
      text: text || null,
      type: type ?? 'text',
      expires_at: expiresAt ? new Date(expiresAt) : null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

async function handleStoryDelete(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const storyId = payload.storyId as string;

  await db
    .updateTable('story')
    .set({ is_deleted: true, updated_at: new Date() })
    .where('id', '=', storyId)
    .where('user_id', '=', userId)
    .execute();
}

async function handleStoryView(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const storyId = payload.storyId as string;
  const reaction = payload.reaction as string | undefined;

  await db
    .insertInto('story_view')
    .values({
      id: crypto.randomUUID(),
      user_id: userId,
      story_id: storyId,
      reaction: reaction || null,
      viewed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict((oc) =>
      oc.columns(['user_id', 'story_id']).doUpdateSet({
        reaction: reaction || null,
        updated_at: new Date(),
      }),
    )
    .execute();
}

// ========== Reaction Handlers ==========

async function handleReactionAdd(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = payload.messageId as string | undefined;
  const storyId = payload.storyId as string | undefined;
  const emoji = payload.emoji as string;

  if (messageId) {
    await db
      .insertInto('reaction')
      .values({
        id: crypto.randomUUID(),
        message_id: messageId,
        story_id: null,
        user_id: userId,
        emoji,
        created_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['message_id', 'user_id']).doUpdateSet({ emoji }),
      )
      .execute();
  } else if (storyId) {
    await db
      .insertInto('reaction')
      .values({
        id: crypto.randomUUID(),
        message_id: null,
        story_id: storyId,
        user_id: userId,
        emoji,
        created_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['story_id', 'user_id']).doUpdateSet({ emoji }),
      )
      .execute();
  }
}

async function handleReactionRemove(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = payload.messageId as string | undefined;
  const storyId = payload.storyId as string | undefined;

  if (messageId) {
    await db
      .deleteFrom('reaction')
      .where('message_id', '=', messageId)
      .where('user_id', '=', userId)
      .execute();
  } else if (storyId) {
    await db
      .deleteFrom('reaction')
      .where('story_id', '=', storyId)
      .where('user_id', '=', userId)
      .execute();
  }
}

// ========== Delivery Handlers ==========

async function handleDeliveryUpdate(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const messageId = payload.messageId as string;
  const status = payload.status as 'pending' | 'sent' | 'delivered' | 'seen';

  await db
    .updateTable('delivery')
    .set({ status, updated_at: new Date() })
    .where('message_id', '=', messageId)
    .where('user_id', '=', userId)
    .execute();
}

// ========== Conversation Handlers ==========

async function handleConversationCreate(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = (payload.conversationId ?? payload.id) as string;
  const type = (payload.type ?? 'private') as 'private' | 'group' | 'broadcast';
  const title = payload.title as string | undefined;
  const groupImg = payload.groupImg as string | undefined;
  const groupBio = payload.groupBio as string | undefined;
  const participantIds = (payload.participantIds ?? []) as string[];

  // Create conversation
  await db
    .insertInto('conversation')
    .values({
      id: conversationId,
      type,
      title: title || null,
      group_img: groupImg || null,
      group_bio: groupBio || null,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();

  // Add creator as admin
  const allParticipants = [
    userId,
    ...participantIds.filter((id) => id !== userId),
  ];

  for (let i = 0; i < allParticipants.length; i++) {
    const participantId = allParticipants[i];
    await db
      .insertInto('participant')
      .values({
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        user_id: participantId,
        role: i === 0 ? 'admin' : 'member',
        unread_count: 0,
        joined_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['conversation_id', 'user_id']).doNothing(),
      )
      .execute();
  }
}

async function handleConversationUpdate(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = payload.conversationId as string;
  const title = payload.title as string | undefined;
  const groupImg = payload.groupImg as string | undefined;
  const groupBio = payload.groupBio as string | undefined;

  // Verify user is admin
  const participant = await db
    .selectFrom('participant')
    .select('role')
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (participant?.role !== 'admin') {
    throw new Error('Only admins can update conversation');
  }

  await db
    .updateTable('conversation')
    .set({
      ...(title !== undefined && { title }),
      ...(groupImg !== undefined && { group_img: groupImg }),
      ...(groupBio !== undefined && { group_bio: groupBio }),
      updated_at: new Date(),
    })
    .where('id', '=', conversationId)
    .execute();
}

async function handleConversationDelete(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = payload.conversationId as string;

  // Verify user is creator or admin
  const conversation = await db
    .selectFrom('conversation')
    .select(['created_by'])
    .where('id', '=', conversationId)
    .executeTakeFirst();

  if (conversation?.created_by !== userId) {
    const participant = await db
      .selectFrom('participant')
      .select('role')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (participant?.role !== 'admin') {
      throw new Error('Only creator or admin can delete conversation');
    }
  }

  await db
    .updateTable('conversation')
    .set({ is_deleted: true, updated_at: new Date() })
    .where('id', '=', conversationId)
    .execute();
}

// ========== Participant Handlers ==========

async function handleParticipantAdd(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = payload.conversationId as string;
  const participantId = payload.participantId as string;
  const role = (payload.role ?? 'member') as 'member' | 'admin';

  // Verify user has permission to add
  const currentParticipant = await db
    .selectFrom('participant')
    .select('role')
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (currentParticipant?.role !== 'admin') {
    throw new Error('Only admins can add participants');
  }

  await db
    .insertInto('participant')
    .values({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      user_id: participantId,
      role,
      unread_count: 0,
      joined_at: new Date(),
      updated_at: new Date(),
    })
    .onConflict((oc) => oc.columns(['conversation_id', 'user_id']).doNothing())
    .execute();
}

async function handleParticipantRemove(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = payload.conversationId as string;
  const participantId = payload.participantId as string;

  // Allow self-removal or admin removal
  if (participantId !== userId) {
    const currentParticipant = await db
      .selectFrom('participant')
      .select('role')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (currentParticipant?.role !== 'admin') {
      throw new Error('Only admins can remove other participants');
    }
  }

  await db
    .deleteFrom('participant')
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', participantId)
    .execute();
}

async function handleMarkAsRead(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const conversationId = payload.conversationId as string;
  const messageId = payload.messageId as string | undefined;

  await db
    .updateTable('participant')
    .set({
      last_read_message_id: messageId || null,
      unread_count: 0,
      updated_at: new Date(),
    })
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .execute();
}
