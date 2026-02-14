/**
 * @fileoverview Socket.IO Event Emitters
 *
 * Provides type-safe functions for emitting socket events from the client.
 * Focused on core messaging and conversation features.
 *
 * @module lib/services/socket/emitters
 */

import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';

// ==========================================
// Types
// ==========================================

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'file';
  replyTo?: string;
}

export interface ReactionPayload {
  messageId: string;
  conversationId: string;
  emoji: string;
}

export interface ReadMessagePayload {
  conversationId: string;
  messageId: string;
}

export interface DeleteMessagePayload {
  conversationId: string;
  messageId: string;
}

export interface CreateConversationPayload {
  conversationId: string
  type?: 'private' | 'group' | 'broadcast'
  participantIds: string[]
  title?: string
  groupImg?: string
}

// ==========================================
// Room Management
// ==========================================

/**
 * Joins a conversation room to receive real-time updates.
 */
export function emitJoinRoom(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
}

/**
 * Leaves a conversation room.
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
 */
export function emitMessage(payload: SendMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_SEND, payload);
}

/**
 * Marks a message as read.
 */
export function emitMessageRead(payload: ReadMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_READ, payload);
}

/**
 * Deletes a message.
 */
export function emitMessageDelete(payload: DeleteMessagePayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_DELETE, payload);
}

/**
 * Adds or toggles a reaction on a message.
 */
export function emitMessageReaction(payload: ReactionPayload): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, payload);
}

// ==========================================
// Typing Indicators
// ==========================================

export function emitTypingStart(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
}

export function emitTypingStop(conversationId: string): void {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
}

// ==========================================
// Conversations
// ==========================================

/**
 * Creates a new conversation.
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
 * Marks an entire conversation as read.
 */
export function emitConversationRead(conversationId: string): void {
  const socket = getSocket()
  socket.emit(SOCKET_EVENTS.CONVERSATION_READ, { conversationId })
}
