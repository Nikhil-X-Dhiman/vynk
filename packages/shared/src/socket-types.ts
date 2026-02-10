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
// Story Events
// =============================================================================

export interface StoryPublishPayload {
  mediaUrl?: string;
  type: MediaType;
  caption?: string;
  text?: string;
  expiresAt?: Date | string;
}

export interface StoryNewPayload {
  storyId: string;
  userId: string;
  contentUrl?: string;
  type?: MediaType;
  caption?: string;
  text?: string;
  createdAt: Date | string;
  expiresAt?: Date | string;
}

export interface StoryViewPayload {
  storyId: string;
  ownerId: string;
}

export interface StoryViewedPayload {
  storyId: string;
  viewerId: string;
  viewedAt: Date | string;
}

export interface StoryDeletePayload {
  storyId: string;
}

export interface StoryDeletedPayload {
  storyId: string;
  userId: string;
}

export interface StoryReactionPayload {
  storyId: string;
  ownerId: string;
  emoji: string;
}

export interface StoryReactionUpdatePayload {
  storyId: string;
  userId: string;
  emoji: string;
  action: 'added' | 'removed';
}

export type StoryCallback = SocketCallback<{ storyId: string }>;

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
// Friendship Events
// =============================================================================

export interface FriendRequestSendPayload {
  targetUserId: string;
}

export interface FriendRequestReceivedPayload {
  requestId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  createdAt: Date | string;
}

export interface FriendRequestRespondPayload {
  requestId: string;
  fromUserId: string;
}

export interface FriendRequestAcceptedPayload {
  friendshipId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface FriendRemovePayload {
  friendId: string;
}

export interface FriendRemovedPayload {
  userId: string;
}

export type FriendshipCallback = SocketCallback<{
  requestId?: string;
  friendshipId?: string;
}>;

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

export type ConversationCallback = SocketCallback<{ conversationId: string }>;
