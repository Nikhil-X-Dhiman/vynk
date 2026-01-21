import { redis } from '../client';
import { typingKey } from '../keys';

export async function getTypingUsers(conversationId: string) {
  try {
    const key = typingKey(conversationId);
    const now = Date.now();

    // 1. Remove expired entries (score < now)
    await redis.zRemRangeByScore(key, '-inf', now);

    // 2. Return remaining active users
    return await redis.zRange(key, 0, -1);
  } catch (error) {
    console.error('Redis GetTyping Error:', error);
    return [];
  }
}
