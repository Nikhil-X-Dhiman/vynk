import { redis } from '../client';
import { cacheKey } from '../keys';

/**
 * Retrieves data from the cache, or fetches it and caches it if missing.
 *
 * @param key - The unique key to identify the cached item.
 * @param ttlSeconds - Time-to-Live in seconds for the cached item.
 * @param fetcher - A function that returns a Promise resolving to the data to be cached.
 * @returns The cached or freshly fetched data.
 */
async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(cacheKey(key));

    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error(`Redis Get Error [${key}]:`, error);
    // Fallback to fresh fetch if Redis fails
  }

  const fresh = await fetcher();

  // If the data is null/undefined, usually we might not want to cache it,
  // or we might want to cache it as "null" to prevent cache stampede/penetration.
  // Here we only cache if it's not undefined.
  if (fresh !== undefined) {
    try {
      await redis.set(cacheKey(key), JSON.stringify(fresh), { EX: ttlSeconds });
    } catch (error) {
      console.error(`Redis Set Error [${key}]:`, error);
      // Proceed even if caching fails
    }
  }

  return fresh;
}

export { getOrSetCache };

/**
 * --- EXAMPLE USAGE ---
 *
 * const user = await getOrSetCache(
 *   `user:${userId}`,
 *   60, // Cache for 60 seconds
 *   async () => {
 *     // This "fetcher" only runs if cache is missing!
 *     return await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();
 *   }
 * );
 */
