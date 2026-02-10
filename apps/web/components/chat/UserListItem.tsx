'use client';

/**
 * @fileoverview Single user row for the users panel.
 * @module components/chat/UserListItem
 */

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { normalizeAvatarUrl } from '@/lib/utils/avatar';
import type { LocalUser } from '@/lib/db';

interface UserListItemProps {
  user: LocalUser;
  onClick: (userId: string) => void;
}

/**
 * Single user row. Memoized for list performance.
 */
export const UserListItem = React.memo(function UserListItem({
  user,
  onClick,
}: UserListItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer"
      onClick={() => onClick(user.id)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={normalizeAvatarUrl(user.avatar) || undefined}
          alt={user.name}
        />
        <AvatarFallback>
          {user.name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
      </div>
    </div>
  );
});
