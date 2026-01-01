import { redis } from '../client';
import { typingKey } from '../keys';

export async function getTypingUsers(conversationId: string) {
  return redis.sMembers(typingKey(conversationId));
}
