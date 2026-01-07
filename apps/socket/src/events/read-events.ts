import { Socket } from 'socket.io';
import { io } from '../server';
import { markAsRead } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';

function registerReadEvents(socket: Socket) {
  const userId: string = socket.data.user.id;
  // Called when user enters the Coversation
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
// TODO: What if i have more than 1 message to read then how to handle the situation here? OR just pass the conversation ID & mark all the messages read for that user

export { registerReadEvents };
