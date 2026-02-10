'use client';

/**
 * @fileoverview Chat window skeleton loading state.
 * @module components/chat/ChatWindowSkeleton
 */

import { cn } from '@/lib/utils/tailwind-helpers';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder skeleton shown while conversation data is loading.
 */
export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-background animate-in fade-in duration-500">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex w-full',
            i % 2 === 0 ? 'justify-start' : 'justify-end',
          )}
        >
          <Skeleton
            className={cn(
              'h-16 w-2/3 max-w-[300px] rounded-lg',
              i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none',
            )}
          />
        </div>
      ))}
    </div>
  );
}
