import { Socket } from 'socket.io';
import { setUserTyping, clearUserTyping } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service';
import { SOCKET_EVENTS } from '@repo/shared';

function registerTypingEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.TYPING_START, async ({ conversationId, receiverId, type }) => {
    try {
      // Optimistic Redis update (fire & forget, or await if critical)
      await setUserTyping({conversationId, userId});

      // Determine Room
      let targetRoom = '';
      if (type === 'group') {
          targetRoom = `group:${conversationId}`;
      } else if (receiverId) {
          targetRoom = RoomService.getPrivateRoomId(userId, receiverId);
      }

      if (targetRoom) {
          // Broadcast to room (excluding sender)
          socket.to(targetRoom).emit(SOCKET_EVENTS.USER_TYPING, {
              conversationId,
              userId
          });
      }
    } catch (error) {
      console.error('Error handling TYPING_START:', error);
    }
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, async ({ conversationId, receiverId, type }) => {
    try {
      await clearUserTyping({ conversationId, userId });

      let targetRoom = '';
      if (type === 'group') {
          targetRoom = `group:${conversationId}`;
      } else if (receiverId) {
          targetRoom = RoomService.getPrivateRoomId(userId, receiverId);
      }

      if (targetRoom) {
          socket.to(targetRoom).emit(SOCKET_EVENTS.TYPING_STOP, {
              conversationId,
              userId
          });
      }
    } catch (error) {
      console.error('Error handling TYPING_STOP:', error);
    }
  });
}

export { registerTypingEvents };
