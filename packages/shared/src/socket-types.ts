/**
 * Socket Event Payload Types
 * Shared between frontend and backend for type safety.
 */

// =============================================================================
// Common Types
// =============================================================================

export type MediaType = 'text' | 'image' | 'video' | 'file';
export type ConversationType = 'private' | 'group';

// =============================================================================
// Message Events
// =============================================================================

export type MessageSendPayload = {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  replyTo?: string;
  receiverId?: string;
  type?: ConversationType;
};

export type MessageNewPayload = {
  messageId: string;
  conversationId: string;
  senderId: string;
  content?: string;
  createdAt: Date | string;
};

export type MessageCallback = {
  success: boolean;
  messageId?: string;
  error?: string;
};

// =============================================================================
// Typing Events
// =============================================================================

export type TypingPayload = {
  conversationId: string;
  userId: string;
};

// =============================================================================
// Presence Events
// =============================================================================

export type UserStatusPayload = {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date | string;
};

export type GetUserStatusPayload = {
  userId: string;
};

// =============================================================================
// Room Events
// =============================================================================

export type JoinRoomPayload = {
  conversationId: string;
};

// =============================================================================
// Story Events
// =============================================================================

export type StoryNewPayload = {
  storyId: string;
  userId: string;
  contentUrl?: string;
  type?: MediaType;
  createdAt: Date | string;
};

// =============================================================================
// User Sync Events
// =============================================================================

export type LocalUserPayload = {
  id: string;
  name: string;
  avatar: string | null;
  phoneNumber?: string;
  bio?: string;
  updatedAt: number;
};
