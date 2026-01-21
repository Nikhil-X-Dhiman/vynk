import { redis } from '../client';
import { cacheKey } from '../keys';

async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(cacheKey(key));

    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error('Redis Get Error:', error);
    // Fallback to fresh fetch if Redis fails
  }

  const fresh = await fetcher();

  try {
    await redis.set(cacheKey(key), JSON.stringify(fresh), { EX: ttlSeconds });
  } catch (error) {
    console.error('Redis Set Error:', error);
    // Proceed even if caching fails
  }

  return fresh;
}

export { getOrSetCache };
