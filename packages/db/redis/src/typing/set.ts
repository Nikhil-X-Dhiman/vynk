import { redis } from '../client';
import { typingKey } from '../keys';
import { TypingEvent } from '../types';

export async function setUserTyping({ conversationId, userId }: TypingEvent) {
  try {
    // Use Sorted Set (ZSET) with the expiration timestamp as the score
    const score = Date.now() + 5000; // Expires in 5 seconds
    await redis.zAdd(typingKey(conversationId), { score, value: userId });
  } catch (error) {
    console.error('Redis SetTyping Error:', error);
  }
}
