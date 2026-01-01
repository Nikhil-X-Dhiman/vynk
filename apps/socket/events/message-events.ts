import { Socket } from 'socket.io';
import { joinConversation } from '../src/rooms';
import { sendMessage } from '@repo/db';
import { io } from '../src/server';

export function registerMessageEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on('conversation:join', ({ conversationId }) => {
    joinConversation(socket, conversationId);
  });

  socket.on('message:send', async (payload) => {
    const messageId = await sendMessage({
      ...payload,
      senderId: userId,
    });

    io.to(`conversation:${payload.conversationId}`).emit('message:new', {
      messageId,
      conversationId: payload.conversationId,
    });
  });
}
