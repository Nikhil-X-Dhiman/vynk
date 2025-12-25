import { getSocket } from './client';
import { SOCKET_EVENTS } from '@repo/shared';

export function joinRoom(conversationId: string) {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
}

export function sendMessage(payload: { conversationId: string; text: string }) {
  const socket = getSocket();
  socket.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
}
