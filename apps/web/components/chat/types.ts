/**
 * @fileoverview Shared types for chat components.
 * @module components/chat/types
 */

import type { LocalConversation } from '@/lib/db';

// ==========================================
// ChatWindow Types
// ==========================================

/** Resolved display info for the active conversation header. */
export interface ConversationInfo {
  name: string;
  avatar: string | null;
  type: 'private' | 'group' | 'broadcast';
  otherUserId?: string;
}

/** Handles exposed by MessageList via ref. */
export interface MessageListHandle {
  scrollToBottom: () => void;
}

/** Handles exposed by MessageInput via ref. */
export interface MessageInputHandle {
  focus: () => void;
}

// ==========================================
// ChatList Types
// ==========================================

/** Filter options for chat list. */
export type FilterType = 'All' | 'Unread' | 'Favourites' | 'Groups';

/** Conversation enriched with computed display fields. */
export interface EnrichedConversation extends LocalConversation {
  name: string;
  avatar: string | null;
  time: string;
}
