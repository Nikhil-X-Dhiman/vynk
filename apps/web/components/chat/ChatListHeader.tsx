'use client';

/**
 * @fileoverview Chat List Header
 * @module components/chat/ChatListHeader
 */

import { SquarePen, EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatListHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 shrink-0">
      <h1 className="text-2xl font-bold text-foreground">Chats</h1>
      <div className="flex gap-1 text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <SquarePen className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <EllipsisVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
