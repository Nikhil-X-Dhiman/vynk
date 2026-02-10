'use client';

/**
 * @fileoverview All-users overlay panel for starting new conversations.
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

/**
 * Overlay panel showing all users with search.
 * Displayed when the user clicks the FAB in the chat list.
 */
export function UsersPanel({
  users,
  totalCount,
  searchQuery,
  onSearchChange,
  onUserClick,
}: UsersPanelProps) {
  return (
    <div className="absolute inset-0 bg-background z-10 overflow-y-auto w-full h-full">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b">
        <h3 className="px-4 py-3 font-semibold text-muted-foreground w-full">
          All Users ({totalCount})
        </h3>
        <ChatSearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search users..."
        />
      </div>

      <div className="flex flex-col">
        {users.map((user) => (
          <UserListItem key={user.id} user={user} onClick={onUserClick} />
        ))}

        {users.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            {totalCount === 0 ? 'Loading users...' : 'No users found'}
          </div>
        )}
      </div>
    </div>
  );
}
