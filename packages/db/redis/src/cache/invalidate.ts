import { redis } from '../client';
import { cacheKey } from '../keys';

async function invalidateCache(key: string) {
  try {
    await redis.del(cacheKey(key));
  } catch (error) {
    console.error('Redis Invalidate Error:', error);
  }
}

export { invalidateCache };
