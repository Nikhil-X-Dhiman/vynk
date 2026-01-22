import { Socket } from 'socket.io';
import { markAsRead } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service'; // Need this for private room ID
import { SOCKET_EVENTS } from '@repo/shared';

function registerReadEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.MESSAGE_READ, async ({ conversationId, messageId, senderId, type }) => {
    try {
      // 1. Update DB (Fix: pass object)
      const result = await markAsRead({
          conversationId,
          userId,
          lastReadMessageId: messageId
      });

      if (result.success) {
        // 2. Notify via Room (No DB lookup for participants)
        // If Private (and we have senderId), emit to private room.
        // If Group, emit to group room.

        let targetRoom = '';
        if (type === 'group') {
            targetRoom = `group:${conversationId}`;
        } else if (senderId) {
             // Determine private room ID using RoomService
             // This ensures we broadcast to the standard room where both participants should be joined
             targetRoom = RoomService.getPrivateRoomId(userId, senderId);
        }

        if (targetRoom) {
            // Emit to the room so both Sender and Receiver (User) get the update
            // This satisfies "receiver logic" as the user (receiver of msg) also gets the event
            chatNamespace.to(targetRoom).emit(SOCKET_EVENTS.USER_SEEN, {
                conversationId,
                userId, // Who read it
                messageId
            });
        } else {
             console.warn('Read event missing type or senderId');
        }
      }
    } catch (error) {
      console.error('Error handling MESSAGE_READ:', error);
    }
  });
}

export { registerReadEvents };
