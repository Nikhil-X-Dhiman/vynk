'use client';

/**
 * @fileoverview Chat Window Skeleton
 * @module components/chat/ChatWindowSkeleton
 */

import { cn } from '@/lib/utils/tailwind-helpers';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-background animate-in fade-in duration-500 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex w-full animate-pulse',
            i % 2 === 0 ? 'justify-start' : 'justify-end',
          )}
        >
          <Skeleton
            className={cn(
              'h-12 w-2/3 max-w-[240px] rounded-2xl',
              i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none',
            )}
          />
        </div>
      ))}
    </div>
  )
}
