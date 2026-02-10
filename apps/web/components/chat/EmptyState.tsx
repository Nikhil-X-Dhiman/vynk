'use client';

/**
 * @fileoverview Empty state placeholder for the chat list.
 * @module components/chat/EmptyState
 */

import { MessageSquareDashed } from 'lucide-react';

/**
 * Shown when no conversations match the current filter/search.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground animate-in fade-in duration-500">
      <MessageSquareDashed className="h-16 w-16 mb-4 opacity-20" />
      <p className="font-medium">No conversations yet</p>
      <p className="text-sm opacity-70">Start a new chat to connect</p>
    </div>
  );
}
