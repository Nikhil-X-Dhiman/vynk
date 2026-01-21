import { redis } from '../client';
import { userKey } from '../keys/user';
import { PresenceStatus, UserPresence } from '../types';

async function getUserPresence(userId: string): Promise<UserPresence | null> {
  try {
    const data = await redis.hGetAll(userKey(userId));

    if (!data.status) return null;

    return {
      status: data.status as PresenceStatus,
      lastSeen: Number(data.lastSeen),
    };
  } catch (error) {
    console.error('Redis GetPresence Error:', error);
    return null;
  }
}

export { getUserPresence };
