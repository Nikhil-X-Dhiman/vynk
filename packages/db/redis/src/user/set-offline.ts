import { redis } from '../client';
import { userKey } from '../keys/user';

async function setUserOffline(userId: string) {
  await redis.hSet(userKey(userId), {
    status: 'offline',
    lastSeen: Date.now().toString(),
  });
}

export { setUserOffline };
