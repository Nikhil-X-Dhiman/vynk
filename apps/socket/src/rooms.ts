import { Socket } from 'socket.io';

function joinConversation(socket: Socket, conversationId: string) {
  socket.join(`conversation:${conversationId}`);
}

function joinSelf(socket: Socket) {
  const userId = socket.data.user.id;
  socket.join(`user:${userId}`);
}

export { joinConversation, joinSelf };
