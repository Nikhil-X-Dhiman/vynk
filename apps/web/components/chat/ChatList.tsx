'use client';

/**
 * @fileoverview Chat List — Main Orchestrator
 *
 * Thin composition layer that wires hooks and sub-components together.
 * Includes network status banner, search, filters, conversation list,
 * users panel, and new-chat FAB.
 *
 * @module components/chat/ChatList
 */

import { useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { UserPlus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useChatListData } from '@/hooks/useChatListData';
import { useStartConversation } from '@/hooks/useStartConversation';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { ChatListHeader } from './ChatListHeader';
import { ChatSearchBar } from './ChatSearchBar';
import { FilterChips } from './FilterChips';
import { ChatListItem } from './ChatListItem';
import { ChatListSkeleton } from './ChatListSkeleton';
import { UsersPanel } from './UsersPanel';
import { EmptyState } from './EmptyState';

// ==========================================
// Component
// ==========================================

export function ChatList() {
  const [showAllUsers, setShowAllUsers] = useState(false);

  const params = useParams();
  const selectedId = params?.id as string | undefined;
  const isOnline = useNetworkStatus();

  // Data & filtering
  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    userSearchQuery,
    setUserSearchQuery,
    filteredConversations,
    filteredUsers,
    isLoading,
  } = useChatListData();

  // Conversation creation
  const handleCloseUsersPanel = useCallback(() => {
    setShowAllUsers(false);
    setUserSearchQuery('');
  }, [setUserSearchQuery]);

  const { isCreating, startChat } = useStartConversation(handleCloseUsersPanel);

  const handleToggleUsersView = useCallback(() => {
    setShowAllUsers((prev) => !prev);
    setUserSearchQuery('');
  }, [setUserSearchQuery]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full flex-col bg-background relative">
      {/* Network status banner */}
      <NetworkStatusBanner isOnline={isOnline} />

      {/* Header, search, filters — hidden when users panel is open */}
      {!showAllUsers && (
        <>
          <ChatListHeader />
          <ChatSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <FilterChips
            active={filter}
            onChange={setFilter}
          />
        </>
      )}

      {/* Main list area */}
      <div className="flex-1 overflow-hidden preserve-3d relative">
        {showAllUsers ? (
          <UsersPanel
            users={filteredUsers}
            totalCount={filteredUsers.length}
            searchQuery={userSearchQuery}
            onSearchChange={setUserSearchQuery}
            onUserClick={startChat}
          />
        ) : isLoading ? (
          <ChatListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <Virtuoso
            style={{ height: '100%', outline: 'none' }}
            data={filteredConversations}
            increaseViewportBy={500}
            computeItemKey={(_, chat) => chat.conversationId}
            itemContent={(_, chat) => (
              <ChatListItem
                chat={chat}
                isSelected={selectedId === chat.conversationId}
              />
            )}
          />
        )}
      </div>

      {/* Floating action button */}
      <Button
        className="absolute bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-30 transition-all duration-300 hover:scale-105 bg-slate-600 text-white hover:bg-slate-700 border-2 border-white dark:border-gray-900"
        size="icon"
        onClick={handleToggleUsersView}
        disabled={isCreating}
      >
        {showAllUsers ? (
          <X className="h-6 w-6" />
        ) : (
          <UserPlus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
