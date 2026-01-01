import { Socket } from 'socket.io';
// import { redis } from '../redis';
// import { io } from '../io';

function registerTypingEvents(socket: Socket) {
  const userId = socket.data.user.id;

  socket.on('typing:start', async ({ conversationId }) => {
    // await redis.set(`typing:${conversationId}:${userId}`, '1', 'EX', 5);

    socket
      .to(`conversation:${conversationId}`)
      .emit('typing:start', { userId });
  });

  socket.on('typing:stop', async ({ conversationId }) => {
    // await redis.del(`typing:${conversationId}:${userId}`);

    socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
  });
}

export { registerTypingEvents };
