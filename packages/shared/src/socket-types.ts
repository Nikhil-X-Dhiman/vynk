/**
 * Socket Event Payload Types
 * Shared between frontend and backend for type safety.
 */

// =============================================================================
// Common Types
// =============================================================================

export type MediaType = 'text' | 'image' | 'video' | 'file';
export type ConversationType = 'private' | 'group';

/** Standard callback response */
export interface SocketCallback<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// =============================================================================
// Message Events
// =============================================================================

export interface MessageSendPayload {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  replyTo?: string;
  receiverId?: string;
  type?: ConversationType;
}

export interface MessageNewPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  createdAt: Date | string;
}

export interface MessageDeletePayload {
  messageId: string;
  conversationId: string;
  type?: ConversationType;
  receiverId?: string;
}

export interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
  deletedBy: string;
}

export interface MessageReactionPayload {
  messageId: string;
  conversationId: string;
  emoji: string;
  type?: ConversationType;
  receiverId?: string;
}

export interface MessageReactionUpdatePayload {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
  action: 'added' | 'removed';
}

export interface MessageReadPayload {
  conversationId: string;
  messageId: string;
  senderId?: string;
  type?: ConversationType;
}

export type MessageCallback = SocketCallback<{ messageId: string }>;

// =============================================================================
// Typing Events
// =============================================================================

export interface TypingPayload {
  conversationId: string;
  receiverId?: string;
  type?: ConversationType;
}

export interface UserTypingPayload {
  conversationId: string;
  userId: string;
}

// =============================================================================
// Presence Events
// =============================================================================

export interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date | string;
}

export interface GetUserStatusPayload {
  userId: string;
}

// =============================================================================
// Room Events
// =============================================================================

export interface JoinRoomPayload {
  conversationId: string;
}

// =============================================================================
// User Sync Events
// =============================================================================

export interface LocalUserPayload {
  id: string;
  name: string;
  avatar: string | null;
  phoneNumber?: string;
  bio?: string;
  updatedAt: number;
}

export interface UserDeltaRequestPayload {
  since: number; // Timestamp of last sync
}

export interface UserDeltaResponsePayload {
  users: LocalUserPayload[];
  syncedAt: number;
}

// =============================================================================
// Conversation Events
// =============================================================================

export interface ConversationCreatePayload {
  /** Client-generated conversation ID (UUIDv7). Server uses this if provided. */
  conversationId?: string
  participantIds: string[]
  isGroup?: boolean
  groupName?: string
  groupAvatar?: string
}

export interface ConversationCreatedPayload {
  conversationId: string;
  isGroup: boolean;
  groupName?: string;
  participants: string[];
  createdAt: Date | string;
}

export interface ConversationJoinPayload {
  conversationId: string;
}

export interface ConversationLeavePayload {
  conversationId: string;
}

export interface ConversationLeftPayload {
  conversationId: string;
  userId: string;
}

export interface ConversationReadPayload {
  conversationId: string
}

export type ConversationCallback = SocketCallback<{ conversationId: string }>;
