import { createClient } from 'redis';
import { env } from 'process';

const client = await createClient({
  url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
});
