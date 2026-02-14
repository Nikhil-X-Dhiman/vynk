'use client';

/**
 * @fileoverview Chat List Skeleton
 * @module components/chat/ChatListSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-2 animate-in fade-in duration-500">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3"
        >
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 overflow-hidden">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
