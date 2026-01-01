import { redis } from '../client';
import { cacheKey } from '../keys';

async function invalidateCache(key: string) {
  await redis.del(cacheKey(key));
}

export { invalidateCache };
