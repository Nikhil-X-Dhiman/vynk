import { clearUserTyping, setUserTyping } from '@repo/db';
import { SOCKET_EVENTS } from '@repo/shared';
import { Socket } from 'socket.io';
// import { redis } from '../redis';
// import { io } from '../io';

function registerTypingEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.TYPING_START, async ({ conversationId }) => {
    setUserTyping({ conversationId, userId });
    // await redis.set(`typing:${conversationId}:${userId}`, '1', 'EX', 5);

    socket
      .to(`conversation:${conversationId}`)
      .emit(SOCKET_EVENTS.TYPING_START, { userId });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, async ({ conversationId }) => {
    clearUserTyping(conversationId, userId);
    // await redis.del(`typing:${conversationId}:${userId}`);

    socket
      .to(`conversation:${conversationId}`)
      .emit(SOCKET_EVENTS.TYPING_STOP, { userId });
  });
}

export { registerTypingEvents };
