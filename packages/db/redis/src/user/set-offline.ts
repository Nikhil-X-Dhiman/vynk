import { redis } from '../client';
import { userKey } from '../keys/user';

async function setUserOffline(userId: string) {
  try {
    await redis.hSet(userKey(userId), {
      status: 'offline',
      lastSeen: Date.now().toString(),
    });
  } catch (error) {
    console.error('Redis SetOffline Error:', error);
  }
}

export { setUserOffline };
