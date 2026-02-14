/**
 * @fileoverview Hook for ChatList data fetching, enrichment, and filtering.
 *
 * Encapsulates all IndexedDB live queries for conversations and users,
 * plus the filter/search logic.
 *
 * @module hooks/useChatListData
 */

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isInitialSyncCompleted } from '@/lib/db'
import { normalizeAvatarUrl } from '@/lib/utils/avatar';
import type { FilterType, EnrichedConversation } from '@/components/chat/types';
import type { LocalUser } from '@/lib/db';
import { formatMessageTime } from '@/lib/utils/date'

interface UseChatListDataResult {
  /** Current filter tab. */
  filter: FilterType;
  setFilter: (f: FilterType) => void;

  /** Conversation search query. */
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /** User search query (users panel). */
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;

  /** Filtered + enriched conversations. */
  filteredConversations: EnrichedConversation[];

  /** Filtered users list. */
  filteredUsers: LocalUser[];

  /** True if still waiting for initial sync and no cached data. */
  isLoading: boolean;
}

/**
 * Fetches, enriches, and filters chat list data from IndexedDB.
 */
export function useChatListData(): UseChatListDataResult {
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // ── Live queries ──────────────────────────────────────────────

  const emptyArray = useMemo(() => [], [])

  const allUsers =
    useLiveQuery(() => db.users.orderBy('name').toArray()) ?? emptyArray

  const rawConversations =
    useLiveQuery(() =>
      db.conversations.orderBy('updatedAt').reverse().toArray(),
    ) ?? emptyArray

  const isSyncCompleted =
    useLiveQuery(() => isInitialSyncCompleted(db)) ?? false

  // ── Enrichment ────────────────────────────────────────────────

  const enrichedConversations: EnrichedConversation[] = useMemo(
    () =>
      rawConversations.map((conv) => ({
        ...conv,
        name: conv.displayName || conv.title || 'Unknown',
        avatar: normalizeAvatarUrl(conv.displayAvatar || conv.groupImg),
        time: formatMessageTime(conv.lastMessageAt || 0),
      })),
    [rawConversations],
  )

  // ── Filtering ─────────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    return enrichedConversations.filter((conv) => {
      if (
        searchQuery &&
        !conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filter === 'Unread') return conv.unreadCount > 0;
      if (filter === 'Groups') return conv.type === 'group';
      if (filter === 'Favourites') return false; // Not yet implemented
      return true;
    });
  }, [enrichedConversations, filter, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return allUsers;
    return allUsers.filter((u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
    );
  }, [allUsers, userSearchQuery]);

  // ── Loading state ─────────────────────────────────────────────

  const isLoading = !isSyncCompleted && rawConversations.length === 0;

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    userSearchQuery,
    setUserSearchQuery,
    filteredConversations,
    filteredUsers,
    isLoading,
  };
}
