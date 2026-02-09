/**
 * @fileoverview Socket Service Barrel Export
 *
 * Re-exports all socket-related functionality for convenient imports.
 *
 * @module lib/services/socket
 *
 * @example
 * ```ts
 * import {
 *   getSocket,
 *   emitMessage,
 *   onMessageReceived,
 *   registerAllListeners,
 * } from '@/lib/services/socket';
 * ```
 */

// Client
export {
  getSocket,
  isConnected,
  disconnectSocket,
  reconnectSocket,
  getSocketId,
} from './client';

// Emitters
export {
  // Room management
  emitJoinRoom,
  emitJoinConversation,
  emitLeaveConversation,
  // Messages
  emitMessage,
  emitMessageRead,
  emitMessageDelete,
  emitMessageReaction,
  // Typing
  emitTypingStart,
  emitTypingStop,
  // Conversations
  emitCreateConversation,
  // Stories
  emitStoryPublish,
  emitStoryView,
  emitStoryDelete,
  emitStoryReaction,
  // User status
  emitGetUserStatus,
  // Friendship
  emitFriendRequest,
  emitAcceptFriendRequest,
  emitRejectFriendRequest,
  emitRemoveFriend,
  // Legacy
  joinRoom,
  sendMessage,
} from './emitters';

// Emitter types
export type {
  SendMessagePayload,
  ReactionPayload,
  ReadMessagePayload,
  DeleteMessagePayload,
  CreateConversationPayload,
  FriendRequestPayload,
} from './emitters';

// Listeners
export {
  // Registration
  registerConnectionListeners,
  registerUserSyncListeners,
  registerConversationListeners,
  registerStoryListeners,
  registerFriendshipListeners,
  registerAllListeners,
  unregisterAllListeners,
  // Individual listeners
  onMessageReceived,
  onMessageDeleted,
  onReactionUpdate,
  onMessageSeen,
  onUserTyping,
  onUserStatusChange,
} from './listeners';

// Listener types
export type {
  IncomingMessage,
  TypingPayload,
  UserStatusPayload,
  ConversationUpdatePayload,
  StoryPayload,
  FriendRequestPayload as IncomingFriendRequestPayload,
  MessageCallback,
} from './listeners';
