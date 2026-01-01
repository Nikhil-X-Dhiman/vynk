import { redis } from '../client';
import { cacheKey } from '../keys';

async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(cacheKey(key));

  if (cached) {
    return JSON.parse(cached) as T;
  }

  const fresh = await fetcher();

  await redis.set(cacheKey(key), JSON.stringify(fresh), { EX: ttlSeconds });

  return fresh;
}

export { getOrSetCache };
