import { redis } from '../client';
import { typingKey } from '../keys';

export async function clearUserTyping(conversationId: string, userId: string) {
  await redis.sRem(typingKey(conversationId), userId);
}
