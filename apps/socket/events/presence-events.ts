import { Socket } from 'socket.io';
import { setUserOffline, setUserOnline } from '@repo/db';
import { io } from '../src/server';
import { SOCKET_EVENTS } from '@repo/shared';
// import { redis } from '../redis';

function registerPresenceEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // mark online on redis
  setUserOnline(userId);
  io.emit(SOCKET_EVENTS.USER_ONLINE, { userId });
  // redis.set(`online:${userId}`, '1', 'EX', 60);

  socket.on('disconnect', async () => {
    setUserOffline(userId);

    // await redis.del(`online:${userId}`);
    // await redis.set(`lastSeen:${userId}`, Date.now().toString());
  });
}
//TODO: what if i am in converssation & user goes online, how will it handle it: maybe a anew emit for announcing online presence

export { registerPresenceEvents };
