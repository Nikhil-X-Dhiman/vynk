/**
 * @fileoverview Hook for ChatList data fetching.
 *
 * Capabilities:
 * - Live queries for users and conversations
 * - Enrichment of conversation data (avatars, display names)
 * - Filtering logic (All, Unread, Groups, etc.)
 *
 * @module hooks/useChatListData
 */

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isInitialSyncCompleted, LocalUser } from '@/lib/db'
import { normalizeAvatarUrl } from '@/lib/utils/avatar';
import type { FilterType, EnrichedConversation } from '@/components/chat/types'
import { formatMessageTime } from '@/lib/utils/date'

interface UseChatListDataResult {
  filter: FilterType
  setFilter: (f: FilterType) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  userSearchQuery: string
  setUserSearchQuery: (q: string) => void
  filteredConversations: EnrichedConversation[]
  filteredUsers: LocalUser[]
  isLoading: boolean
}

export function useChatListData(): UseChatListDataResult {
  const [filter, setFilter] = useState<FilterType>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Stable empty array reference
  const emptyArray = useMemo(() => [], [])

  // Live Queries
  const allUsers =
    useLiveQuery(() => db.users.orderBy('name').toArray()) ?? emptyArray

  const rawConversations =
    useLiveQuery(() =>
      db.conversations.orderBy('updatedAt').reverse().toArray(),
    ) ?? emptyArray

  const isSyncCompleted =
    useLiveQuery(() => isInitialSyncCompleted(db)) ?? false

  // Enrichment
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

  // Filtering
  const filteredConversations = useMemo(() => {
    return enrichedConversations.filter((conv) => {
      // Search
      if (
        searchQuery &&
        !conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      // Filter Tabs
      if (filter === 'Unread') return conv.unreadCount > 0
      if (filter === 'Groups') return conv.type === 'group'
      // 'Favourites' - implementation pending / removed for now
      return true
    })
  }, [enrichedConversations, filter, searchQuery])

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return allUsers
    return allUsers.filter((u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
    )
  }, [allUsers, userSearchQuery])

  const isLoading = !isSyncCompleted && rawConversations.length === 0

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
  }
}
