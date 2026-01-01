import { Socket } from 'socket.io';
import { io } from '../src/server';
import { markAsRead } from '@repo/db';

export function registerReadEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on('message:read', async ({ conversationId, messageId }) => {
    await markAsRead({
      conversationId,
      userId,
      lastReadMessageId: messageId,
    });

    io.to(`conversation:${conversationId}`).emit('message:seen', {
      userId,
      messageId,
    });
  });
}
