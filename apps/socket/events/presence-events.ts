import { Socket } from 'socket.io';
// import { redis } from '../redis';

export function registerPresenceEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // online
  // redis.set(`online:${userId}`, '1', 'EX', 60);

  socket.on('disconnect', async () => {
    // await redis.del(`online:${userId}`);
    // await redis.set(`lastSeen:${userId}`, Date.now().toString());
  });
}
