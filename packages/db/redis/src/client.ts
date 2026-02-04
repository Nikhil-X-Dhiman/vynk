import { createClient } from 'redis';
import { env } from '@repo/validation';

// Build URL based on authenticated or unauthenticated connection
const redisUrl =
  env.REDIS_PASSWORD
    ? `redis://:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`
    : `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => console.error('Redis Client Error', err));

// Connect immediately
if (!redis.isOpen) {
  redis.connect().catch((e) => {
    console.warn(
      'Failed to connect to Redis. Ensure it is running to enable caching.',
      e,
    );
  });
}

export { redis };
