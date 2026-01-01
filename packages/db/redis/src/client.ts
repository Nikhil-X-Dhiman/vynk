import { createClient } from 'redis';
import { env } from 'process';

const redis = await createClient({
  url: `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`,
});

redis.connect();

redis.on('error', (err)=>{
  console.error(`Redis Error: ${err}`);
})

export {redis};

// Online Users
// export const setOnline = (userId: string) =>
//   redis.set(`online:${userId}`, '1', 'EX', 60);

// export const setOffline = (userId: string) => redis.del(`online:${userId}`);

// export const isOnline = async (userId: string) =>
//   Boolean(await redis.get(`online:${userId}`));


// // Typing Indicator
// export const setTyping = (conversationId: string, userId: string) =>
//   redis.set(`typing:${conversationId}:${userId}`, '1', 'EX', 5);


// // Last Seen
// export const updateLastSeen = (userId: string) =>
//   redis.set(`lastSeen:${userId}`, Date.now().toString());
