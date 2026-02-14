/**
 * @fileoverview Socket.IO Event Emitters
 *
 * Provides type-safe functions for emitting socket events from the client.
 * All events use the shared SOCKET_EVENTS constants for consistency.
 *
 * @module lib/services/socket/emitters
 *
 * @example
 * ```ts
 * import { emitMessage, emitTypingStart, emitJoinRoom } from '@/lib/services/socket';
 *
 * // Join a conversation room
 * emitJoinRoom('conv-123');
 *
 * // Send a message
 * emitMessage({ conversationId: 'conv-123', content: 'Hello!' });
 *
 * // Start typing indicator
 * emitTypingStart('conv-123');
 * ```
 */

import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';

// ==========================================
// Types
// ==========================================

/**
 * Payload for sending a message.
 */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  replyTo?: string;
}

/**
 * Payload for message reactions.
 */
export interface ReactionPayload {
  messageId: string;
  conversationId: string;
  emoji: string;
}

/**
 * Payload for reading messages.
 */
export interface ReadMessagePayload {
  conversationId: string;
  messageId: string;
}

/**
 * Payload for deleting a message.
 */
export interface DeleteMessagePayload {
  conversationId: string;
  messageId: string;
}

/**
 * Payload for creating a conversation.
 */
export interface CreateConversationPayload {
  /** Client-generated conversation ID (UUIDv7) */
  conversationId: string
  type?: 'private' | 'group' | 'broadcast'
  participantIds: string[]
  title?: string
  groupImg?: string
}

/**
 * Payload for friend request.
 */
export interface FriendRequestPayload {
  targetUserId: string;
}

// ==========================================
// Room Management
// ==========================================

/**
 * Joins a conversation room to receive real-time updates.
 * @param conversationId - ID of the conversation to join
 */
export function emitJoinRoom(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
}

/**
 * Joins a conversation (alias for emitJoinRoom).
 * @param conversationId - ID of the conversation to join
 */
export function emitJoinConversation(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
}

/**
 * Leaves a conversation room.
 * @param conversationId - ID of the conversation to leave
 */
export function emitLeaveConversation(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId });
}

// ==========================================
// Messages
// ==========================================

/**
 * Sends a message to a conversation.
 * @param payload - Message data including content and conversation ID
 */
export function emitMessage(payload: SendMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_SEND, payload);
}

/**
 * Marks a message as read.
 * @param payload - Message and conversation IDs
 */
export function emitMessageRead(payload: ReadMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_READ, payload);
}

/**
 * Deletes a message.
 * @param payload - Message and conversation IDs
 */
export function emitMessageDelete(payload: DeleteMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_DELETE, payload);
}

/**
 * Adds or toggles a reaction on a message.
 * @param payload - Reaction data
 */
export function emitMessageReaction(payload: ReactionPayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, payload);
}

// ==========================================
// Typing Indicators
// ==========================================

/**
 * Notifies server that user started typing.
 * @param conversationId - ID of the conversation
 */
export function emitTypingStart(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
}

/**
 * Notifies server that user stopped typing.
 * @param conversationId - ID of the conversation
 */
export function emitTypingStop(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
}

// ==========================================
// Conversations
// ==========================================

/**
 * Creates a new conversation.
 * @param payload - Conversation creation data
 */
export function emitCreateConversation(
  payload: CreateConversationPayload,
): Promise<{
  success: boolean
  data?: { conversationId: string }
  error?: string
}> {
  const socket = getSocket()
  return new Promise((resolve) => {
    socket.emit(SOCKET_EVENTS.CONVERSATION_CREATE, payload, (response: any) => {
      resolve(response)
    })
  })
}

/**
 * Marks all messages in a conversation as read.
 * @param conversationId - ID of the conversation to mark as read
 */
export function emitConversationRead(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.CONVERSATION_READ, { conversationId });
}

// ==========================================
// Stories
// ==========================================

/**
 * Publishes a new story.
 * @param payload - Story data
 */
export function emitStoryPublish(payload: {
  contentUrl: string;
  type: 'text' | 'image' | 'video';
  caption?: string;
  text?: string;
}): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.STORY_PUBLISH, payload);
}

/**
 * Records a story view.
 * @param storyId - ID of the viewed story
 */
export function emitStoryView(storyId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.STORY_VIEW, { storyId });
}

/**
 * Deletes a story.
 * @param storyId - ID of the story to delete
 */
export function emitStoryDelete(storyId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.STORY_DELETE, { storyId });
}

/**
 * Reacts to a story.
 * @param payload - Story reaction data
 */
export function emitStoryReaction(payload: {
  storyId: string;
  emoji: string;
}): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.STORY_REACTION, payload);
}

// ==========================================
// User Status
// ==========================================

/**
 * Requests current status of a user.
 * @param userId - ID of the user to check
 */
export function emitGetUserStatus(userId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.GET_USER_STATUS, { userId });
}

// ==========================================
// Friendship
// ==========================================

/**
 * Sends a friend request.
 * @param targetUserId - ID of the user to befriend
 */
export function emitFriendRequest(targetUserId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.FRIEND_REQUEST_SEND, { targetUserId });
}

/**
 * Accepts a friend request.
 * @param requesterId - ID of the user who sent the request
 */
export function emitAcceptFriendRequest(requesterId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPT, { requesterId });
}

/**
 * Rejects a friend request.
 * @param requesterId - ID of the user who sent the request
 */
export function emitRejectFriendRequest(requesterId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.FRIEND_REQUEST_REJECT, { requesterId });
}

/**
 * Removes a friend.
 * @param friendId - ID of the friend to remove
 */
export function emitRemoveFriend(friendId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.FRIEND_REMOVE, { friendId });
}

// ==========================================
// Legacy Exports (for backward compatibility)
// ==========================================

/** @deprecated Use emitJoinRoom instead */
export const joinRoom = emitJoinRoom;

/** @deprecated Use emitMessage instead */
export const sendMessage = (payload: {
  conversationId: string;
  text: string;
}) => {
  emitMessage({
    conversationId: payload.conversationId,
    content: payload.text,
  });
};
