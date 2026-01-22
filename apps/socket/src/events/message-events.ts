import { Socket } from 'socket.io';
import { sendMessage } from '@repo/db';
import { chatNamespace } from '../server';
import { RoomService } from '../services/room-service';
import { SOCKET_EVENTS } from '@repo/shared';

function registerMessageEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // CONVERSATION_JOIN removed as per requirement.
  // Clients rely on auto-join (groups) or lazy-join (private).

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
    try {
      const { conversationId, content, mediaUrl, mediaType, replyTo, receiverId, type } = payload;

      // 1. Persist to DB
      const result = await sendMessage({
        conversationId,
        senderId: userId,
        content,
        mediaUrl,
        mediaType,
        replyTo
      });

      if (!result.success || !result.data) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      const messageId = result.data;
      const messageData = {
          messageId,
          conversationId,
          senderId: userId,
          content, // Optimistic update support
          createdAt: new Date()
      };

      // 2. Emit to Room based on Type
      if (type === 'group') {
          // Direct emit to group room
          chatNamespace.to(`group:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, messageData);
      } else if (receiverId) {
          // Private Chat
          const privateRoom = RoomService.getPrivateRoomId(userId, receiverId);

          // Lazy Join: Ensure target is in room if online
          // We can try to force join the target if they are connected to this namespace
          // Since we don't have easy access to target's socket ID without a map,
          // we rely on the client or a previous 'invite' mechanism.
          // WAIT! Socket.IO 4.0+ `io.in(id).socketsJoin(room)` WORKS across nodes with Redis Adapter!
          // So we CAN do:
          await chatNamespace.in(`user:${receiverId}`).socketsJoin(privateRoom);

          // Ensure sender is also in it (should be, but just in case)
          await chatNamespace.in(`user:${userId}`).socketsJoin(privateRoom);

          // Now emit to the private room
          chatNamespace.to(privateRoom).emit(SOCKET_EVENTS.MESSAGE_NEW, messageData);
      } else {
          // Fallback if type/receiver not provided?
          // Maybe try to fetch from DB? But user wants to avoid DB lookups.
          console.warn('Message send missing type or receiverId');
      }

      // 3. Update Chat Lists (Optimized)
      // Usually `MESSAGE_NEW` is enough if payload has details.
      // User didn't explicitly ban `conversation:update` but said "don't do manual getting participants".
      // Since we emit to `group:{id}` or `private_...`, everyone in there gets `MESSAGE_NEW`.

      if (callback) callback({ success: true, messageId });
    } catch (error) {
      console.error('Error handling MESSAGE_SEND:', error);
      if (callback) callback({ success: false, error: 'Internal Server Error' });
    }
  });
}

export { registerMessageEvents };
