'use client';

/**
 * @fileoverview Empty State
 * @module components/chat/EmptyState
 */

import { MessageSquareDashed } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        <MessageSquareDashed className="h-8 w-8 opacity-50" />
      </div>
      <p className="font-semibold text-lg mb-1">No chats yet</p>
      <p className="text-sm opacity-70 max-w-xs">
        Start a new conversation to connect with people easily.
      </p>
    </div>
  )
}
