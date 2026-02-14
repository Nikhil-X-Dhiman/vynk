'use client';

/**
 * @fileoverview Users Panel Overlay
 * @module components/chat/UsersPanel
 */

import type { LocalUser } from '@/lib/db';
import { ChatSearchBar } from './ChatSearchBar';
import { UserListItem } from './UserListItem';

interface UsersPanelProps {
  users: LocalUser[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUserClick: (userId: string) => void;
}

export function UsersPanel({
  users,
  totalCount,
  searchQuery,
  onSearchChange,
  onUserClick,
}: UsersPanelProps) {
  return (
    <div className="absolute inset-0 bg-background z-20 overflow-y-auto w-full h-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-30 border-b pb-2">
        <h3 className="px-4 py-3 font-semibold text-foreground w-full">
          Select Contact ({totalCount})
        </h3>
        <ChatSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search people..."
        />
      </div>

      <div className="flex flex-col pb-20">
        {users.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            onClick={onUserClick}
          />
        ))}

        {users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>{searchQuery ? 'No users found' : 'Loading users...'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
