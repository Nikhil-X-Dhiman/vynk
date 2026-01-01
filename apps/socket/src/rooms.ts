import { Socket } from 'socket.io';

export function joinConversation(socket: Socket, conversationId: string) {
  socket.join(`conversation:${conversationId}`);
}
