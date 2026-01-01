import { Socket } from 'socket.io';
import { joinConversation } from '../src/rooms';
import { sendMessage } from '@repo/db';
import { io } from '../src/server';
import { SOCKET_EVENTS } from '@repo/shared';

function registerMessageEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, ({ conversationId }) => {
    joinConversation(socket, conversationId);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload) => {
    const messageId = await sendMessage({
      ...payload,
      senderId: userId,
    });

    io.to(`conversation:${payload.conversationId}`).emit(
      SOCKET_EVENTS.MESSAGE_NEW,
      {
        messageId,
        conversationId: payload.conversationId,
      }
    );
  });
}
// TODO: Here, if i am at conversation page, then how will the above will behave if i an neither inside any conversation & neither the page will refresh, how will it give the latest update of new msg in conversation page
export { registerMessageEvents };
