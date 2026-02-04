/**
 * Socket Event Payload Types
 * Shared between frontend and backend for type safety.
 */

// ============ Message Events ============

/**
 * Payload for sending a new message
 */
export interface MessageSendPayload {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  replyTo?: string;
  /** Receiver ID for private chats */
  receiverId?: string;
  /** Conversation type: 'private' | 'group' */
  type?: 'private' | 'group';
}

/**
 * Payload for new message event (server -> client)
 */
export interface MessageNewPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  content?: string;
  createdAt: Date | string;
}

/**
 * Callback response for message operations
 */
export interface MessageCallback {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============ Typing Events ============

export interface TypingPayload {
  conversationId: string;
  userId: string;
}

// ============ Presence Events ============

export interface UserStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date | string;
}

export interface GetUserStatusPayload {
  userId: string;
}

// ============ Room Events ============

export interface JoinRoomPayload {
  conversationId: string;
}

// ============ Story Events ============

export interface StoryNewPayload {
  storyId: string;
  userId: string;
  contentUrl?: string;
  type?: 'text' | 'image' | 'video';
  createdAt: Date | string;
}

// ============ User Sync Events ============

export interface LocalUserPayload {
  id: string;
  name: string;
  avatar: string | null;
  phoneNumber?: string;
  bio?: string;
  updatedAt: number;
}
