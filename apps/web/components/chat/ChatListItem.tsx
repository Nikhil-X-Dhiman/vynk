'use client';

/**
 * @fileoverview Chat List Item
 * @module components/chat/ChatListItem
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/tailwind-helpers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { EnrichedConversation } from './types';

interface ChatListItemProps {
  chat: EnrichedConversation;
  isSelected: boolean;
}

export const ChatListItem = React.memo(function ChatListItem({ chat, isSelected }: ChatListItemProps) {
  // Logic: passing query param or relying on path? Reference used path.
  // If selected, clicking again goes back to list (mobile pattern).
  const href = isSelected ? '/chats' : `/chats/${chat.conversationId}`

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer transform-gpu outline-none',
        isSelected && 'bg-accent',
      )}
      style={{ contain: 'content' }}
    >
      <div className="h-12 w-12 shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={chat.avatar || undefined}
            alt={chat.name}
            className="object-cover"
          />
          <AvatarFallback>
            {chat.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-foreground truncate text-base">
            {chat.name}
          </h3>
          <span
            className={cn(
              'text-xs whitespace-nowrap ml-2',
              chat.unreadCount > 0
                ? 'text-primary font-bold'
                : 'text-muted-foreground',
            )}
          >
            {chat.time}
          </span>
        </div>

        <div className="flex justify-between items-center h-5">
          <p className="text-sm text-muted-foreground truncate pr-2 w-full">
            {chat.lastMessage || 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <Badge
              variant="default"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] p-0"
            >
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
});
