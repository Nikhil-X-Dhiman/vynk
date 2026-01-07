import { createClient } from 'redis';

const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

// Build URL: fallback to defaults if some are missing
const redisUrl = `redis://${REDIS_USERNAME || ''}:${REDIS_PASSWORD || ''}@${
  REDIS_HOST || 'localhost'
}:${REDIS_PORT || '6379'}`;

const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => console.error('Redis Client Error', err));

// Connect immediately
if (!redis.isOpen) {
  redis.connect().catch(() => {
    console.error(
      'Failed to connect to Redis. Check if Docker container is running.'
    );
  });
}

export { redis };
