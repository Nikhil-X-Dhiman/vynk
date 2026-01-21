import { Socket } from 'socket.io';
import { joinConversation } from '../rooms';
import { sendMessage, getConversationParticipants } from '@repo/db';
import { io } from '../server';
import { SOCKET_EVENTS } from '@repo/shared';

function registerMessageEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, ({ conversationId }) => {
    try {
      joinConversation(socket, conversationId);
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
    try {
      const result = await sendMessage({
        ...payload,
        senderId: userId,
      });

      if (!result.success || !result.data) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      const messageId = result.data;

      // 1. Emit to the conversation room (for open chats)
      io.to(`conversation:${payload.conversationId}`).emit(
        SOCKET_EVENTS.MESSAGE_NEW,
        {
          messageId,
          conversationId: payload.conversationId,
        }
      );

      // 2. Notify all participants to update their chat list
      const participantsResult = await getConversationParticipants(
        payload.conversationId
      );

      if (participantsResult.success && participantsResult.data) {
        // Emit event to each user's personal room
        participantsResult.data.forEach((p) => {
          io.to(`user:${p.userId}`).emit('conversation:update', {
            conversationId: payload.conversationId,
            lastMessageId: messageId,
          });
        });
      }

      if (callback) callback({ success: true, messageId });
    } catch (error) {
      console.error('Error handling MESSAGE_SEND:', error);
      if (callback) callback({ success: false, error: 'Internal Server Error' });
    }
  });
}
// TODO: When userA join the conversation with userB, userA will join conversation but how will userB join the same conversation? need to write the logic to add the userB to conversation if not present already
// TODO: Here, if i am at conversation page, then how will the above will behave if i an neither inside any conversation & neither the page will refresh, how will it give the latest update of new msg in conversation page
export { registerMessageEvents };
