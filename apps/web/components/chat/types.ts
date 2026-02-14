/**
 * @fileoverview Shared types for chat components.
 * @module components/chat/types
 */

import type { LocalConversation, LocalUser } from '@/lib/db'

export interface ConversationInfo {
  name: string;
  avatar: string | null;
  type: 'private' | 'group' | 'broadcast';
  otherUserId?: string;
}

export interface MessageListHandle {
  scrollToBottom: () => void;
}

export interface MessageInputHandle {
  focus: () => void;
}

export type FilterType = 'All' | 'Unread' | 'Favourites' | 'Groups';

export interface EnrichedConversation extends LocalConversation {
  name: string;
  avatar: string | null;
  time: string;
}
