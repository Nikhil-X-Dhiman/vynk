'use client';

/**
 * @fileoverview User List Item
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

export const UserListItem = React.memo(function UserListItem({
  user,
  onClick,
}: UserListItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer active:bg-accent/80"
      onClick={() => onClick(user.id)}
    >
      <Avatar className="h-10 w-10 border border-border">
        <AvatarImage
          src={normalizeAvatarUrl(user.avatar) || undefined}
          alt={user.name}
          className="object-cover"
        />
        <AvatarFallback>{user.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{user.name}</h3>
        {user.bio && (
          <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
        )}
      </div>
    </div>
  )
});
