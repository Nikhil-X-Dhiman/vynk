import { Socket } from 'socket.io';
import { io } from '../src/server';
import { markAsRead } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';

function registerReadEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(
    SOCKET_EVENTS.MESSAGE_READ,
    async ({ conversationId, messageId }) => {
      await markAsRead({
        conversationId,
        userId,
        lastReadMessageId: messageId,
      });

      io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_SEEN, {
        userId,
        messageId,
      });
    }
  );
}

export { registerReadEvents };
