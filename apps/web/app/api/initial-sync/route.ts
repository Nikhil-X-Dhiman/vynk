/**
 * @fileoverview Initial Sync API Route
 *
 * **GET /api/initial-sync**
 *
 * Performs a full data load on first login or app refresh. Returns:
 * - All registered users (excluding the current user)
 * - All conversations the user participates in, enriched with:
 *   - Participant metadata
 *   - Display name / avatar (derived from the other user in private chats)
 *   - Last message preview
 *
 * The response is shaped for direct insertion into the client's
 * local (Dexie/IndexedDB) database.
 *
 * @module app/api/initial-sync/route
 */

import { NextResponse } from 'next/server';
import {
  getAllUsers,
  getUserConversations,
  getParticipants,
  getMessages,
  findUsersByIds,
  type ConversationListItem,
  type UserListItem,
  type UserBasic,
} from '@repo/db'
import { checkServerAuth } from '@/lib/auth/check-server-auth';

// ==========================================
// Types
// ==========================================

/** Formatted user for the client's local database. */
interface SyncUser {
  id: string;
  name: string;
  avatar: string | null;
  phoneNumber: string;
  bio: string;
  updatedAt: number;
}

/** Participant entry for the client's local database. */
interface SyncParticipant {
  odId: string;
  odConversationId: string;
  odUserId: string;
  role: 'member';
  unreadCount: number;
}

/** Formatted conversation for the client's local database. */
interface SyncConversation {
  conversationId: string;
  title: string;
  type: 'group' | 'private';
  groupImg: string;
  createdAt: number;
  updatedAt: number;
  lastMessageId: undefined;
  lastMessage: string;
  lastMessageAt: number | null;
  unreadCount: number;
  participants: SyncParticipant[];
}

/** Formatted message for the client's local database. */
interface SyncMessage {
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

/** Successful initial sync response. */
interface InitialSyncResponse {
  success: true
  users: SyncUser[]
  conversations: SyncConversation[]
  messages: SyncMessage[]
  timestamp: string
}

/** Error response. */
interface ErrorResponse {
  success: false;
  error: string;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Creates a consistent JSON error response.
 */
function errorResponse(
  error: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Formats a list of database users into the client-side shape.
 */
function formatUsers(users: UserListItem[]): SyncUser[] {
  return users.map((u) => ({
    id: u.id,
    name: u.name || '',
    avatar: u.avatar || null,
    phoneNumber: u.phoneNumber || '',
    bio: u.bio || '',
    updatedAt: new Date(u.updatedAt).getTime(),
  }));
}

/**
 * Resolves the display name and avatar for a conversation.
 *
 * - **Group chats**: uses the conversation's own name and group_img.
 * - **Private chats**: looks up the *other* participant's profile.
 */
function resolveConversationDisplay(
  conversation: ConversationListItem,
  participants: { user_id: string; role: string | null }[],
  participantUsers: UserBasic[],
  currentUserId: string,
): { displayName: string; avatar: string | null } {
  // Groups use their own metadata
  if (conversation.is_group) {
    return {
      displayName: conversation.name || '',
      avatar: conversation.group_img || null,
    };
  }

  // Private chats: find the other participant's profile
  const otherParticipant = participants.find(
    (p) => p.user_id !== currentUserId,
  );

  if (!otherParticipant) {
    // If no other participant, check if current user is a participant (self-chat)
    const selfUser = participantUsers.find((u) => u.id === currentUserId)
    return {
      displayName: selfUser ? 'You (Saved Messages)' : 'Unknown',
      avatar: selfUser?.avatar || null,
    }
  }

  const otherUser = participantUsers.find(
    (u) => u.id === otherParticipant.user_id,
  );

  return {
    displayName: otherUser?.name || 'Unknown',
    avatar: otherUser?.avatar || null,
  };
}

/**
 * Enriches a single conversation with participant data and resolved display info.
 */
async function enrichConversation(
  conversation: ConversationListItem,
  currentUserId: string,
): Promise<SyncConversation | null> {
  // Fetch participants
  const participantsResult = await getParticipants(conversation.id);

  if (!participantsResult.success) {
    console.error(
      `[InitialSync] Failed to fetch participants for conversation ${conversation.id}:`,
      participantsResult.error,
    );
    return null;
  }

  const participants = participantsResult.data;
  const participantUserIds = participants.map((p) => p.user_id);

  // Fetch participant user profiles
  const usersResult = await findUsersByIds(participantUserIds);

  if (!usersResult.success) {
    console.error(
      `[InitialSync] Failed to fetch participant users for conversation ${conversation.id}:`,
      usersResult.error,
    );
    return null;
  }

  const { displayName, avatar } = resolveConversationDisplay(
    conversation,
    participants,
    usersResult.data,
    currentUserId,
  );

  return {
    conversationId: conversation.id,
    title: displayName,
    type: conversation.is_group ? 'group' : 'private',
    groupImg: avatar || '',
    createdAt: new Date(conversation.updated_at).getTime(),
    updatedAt: new Date(conversation.updated_at).getTime(),
    lastMessageId: undefined,
    lastMessage: conversation.last_message || '',
    lastMessageAt: conversation.last_message_at
      ? new Date(conversation.last_message_at).getTime()
      : null,
    unreadCount: conversation.unread_count || 0,
    participants: participants.map((p) => ({
      odId: `${conversation.id}_${p.user_id}`,
      odConversationId: conversation.id,
      odUserId: p.user_id,
      role: 'member' as const,
      unreadCount: 0,
    })),
  };
}

// ==========================================
// GET /api/initial-sync
// ==========================================

/**
 * Performs the initial full sync on login.
 *
 * Returns all users and enriched conversations for the client to
 * populate its local offline database.
 *
 * @returns `InitialSyncResponse` on success, `ErrorResponse` on failure
 */
export async function GET(): Promise<
  NextResponse<InitialSyncResponse | ErrorResponse>
> {
  try {
    const { isAuth, session } = await checkServerAuth()

    if (!isAuth) {
      return errorResponse('Unauthorized', 401)
    }

    const userId = session.user.id

    // Fetch all users (including self) and conversations in parallel
    const [usersResult, conversationsResult] = await Promise.all([
      getAllUsers(), // Don't exclude self
      getUserConversations(userId),
    ])

    if (!usersResult.success) {
      console.error('[InitialSync] Failed to fetch users:', usersResult.error)
      return errorResponse('Failed to fetch users', 500)
    }

    if (!conversationsResult.success) {
      console.error(
        '[InitialSync] Failed to fetch conversations:',
        conversationsResult.error,
      )
      return errorResponse('Failed to fetch conversations', 500)
    }

    // Enrich conversations with participant data (parallel per conversation)
    const enrichedResults = await Promise.all(
      conversationsResult.data.map((c) => enrichConversation(c, userId)),
    )

    // Filter out any conversations that failed to enrich
    const conversations = enrichedResults.filter(
      (c): c is SyncConversation => c !== null,
    )

    // Fetch recent messages for each conversation
    const messagesResults = await Promise.all(
      conversations.map((c) =>
        getMessages({ conversationId: c.conversationId, limit: 50 }),
      ),
    )

    const messages: SyncMessage[] = messagesResults
      .flatMap((result) => (result.success ? result.data : []))
      .map((m) => ({
        messageId: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content || '',
        mediaType: m.media_type || null,
        mediaUrl: m.media_url || null,
        replyTo: m.reply_to || null,
        status: 'seen', // Default to seen for history
        timestamp: new Date(m.created_at).getTime(),
        updatedAt: new Date(m.updated_at).getTime(),
      }))

    return NextResponse.json({
      success: true,
      users: formatUsers(usersResult.data),
      conversations,
      messages,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[InitialSync] Unexpected error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
