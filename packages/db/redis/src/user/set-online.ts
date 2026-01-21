import { redis } from '../client';
import { userKey } from '../keys/user';

async function setUserOnline(userId: string) {
  try {
    await redis.hSet(userKey(userId), {
      status: 'online',
      lastSeen: Date.now().toString(),
    });

    // Optional TTL so stale users auto-expire
    await redis.expire(userKey(userId), 60 * 5);
  } catch (error) {
    console.error('Redis SetOnline Error:', error);
  }
}

export { setUserOnline };
