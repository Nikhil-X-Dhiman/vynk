'use client';

/**
 * @fileoverview Chat list skeleton loading state.
 * @module components/chat/ChatListSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder skeleton shown while initial sync is in progress.
 */
export function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-2 animate-in fade-in duration-500">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
