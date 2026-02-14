/**
 * @fileoverview Socket Service Barrel Export
 *
 * Re-exports all socket-related functionality for convenient imports.
 *
 * @module lib/services/socket
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
} from './emitters'

// Emitter types
export type {
  SendMessagePayload,
  ReactionPayload,
  ReadMessagePayload,
  DeleteMessagePayload,
  CreateConversationPayload,
} from './emitters'

// Listeners
export {
  // Registration
  registerConnectionListeners,
  registerUserSyncListeners,
  registerConversationListeners,
  registerAllListeners,
  unregisterAllListeners,
  // Individual listeners
  onMessageReceived,
  onMessageDeleted,
  onReactionUpdate,
  onMessageSeen,
  onMessageDelivered,
  onUserTyping,
  onUserStatusChange,
} from './listeners'

// Listener types
export type {
  IncomingMessage,
  TypingPayload,
  UserStatusPayload,
  ConversationUpdatePayload,
  MessageCallback,
} from './listeners'
