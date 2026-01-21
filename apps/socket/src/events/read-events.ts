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
      try {
        const result = await markAsRead({
          conversationId,
          userId,
          lastReadMessageId: messageId,
        });

        if (result.success) {
          io.to(`conversation:${conversationId}`).emit(
            SOCKET_EVENTS.MESSAGE_SEEN,
            {
              userId,
              messageId,
              conversationId, // Sending convId helps client routing
            }
          );
        } else {
          console.error('Failed to mark as read:', result.error);
        }
      } catch (error) {
        console.error('Error handling MESSAGE_READ:', error);
      }
    }
  );
}
// TODO: What if i have more than 1 message to read then how to handle the situation here? OR just pass the conversation ID & mark all the messages read for that user

export { registerReadEvents };
