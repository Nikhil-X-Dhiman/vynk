import { redis } from '../client';
import { typingKey } from '../keys';
import { TypingEvent } from '../types';

export async function setUserTyping({ conversationId, userId }: TypingEvent) {
  await redis.sAdd(typingKey(conversationId), userId);

  // Auto-expire so typing doesn't get stuck
  await redis.expire(typingKey(conversationId), 5);
}
