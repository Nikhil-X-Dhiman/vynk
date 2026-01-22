import { redis } from '../client';
import { typingKey } from '../keys';

export async function clearUserTyping({ conversationId, userId }: { conversationId: string, userId: string }) {
  try {
    // Was sRem, now zRem because we switched to ZSET
    await redis.zRem(typingKey(conversationId), userId);
  } catch (error) {
    console.error('Redis ClearTyping Error:', error);
  }
}
