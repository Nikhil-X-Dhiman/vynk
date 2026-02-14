'use client';

/**
 * @fileoverview Filter Chips
 * @module components/chat/FilterChips
 */

import { Badge } from '@/components/ui/badge';
import type { FilterType } from './types';
import { cn } from '@/lib/utils/tailwind-helpers'

const FILTERS: FilterType[] = ['All', 'Unread', 'Favourites', 'Groups'];

interface FilterChipsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar shrink-0">
      {FILTERS.map((f) => (
        <Badge
          key={f}
          variant={active === f ? 'default' : 'secondary'}
          className={cn(
            'cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-all hover:bg-opacity-80 active:scale-95 select-none',
            active !== f && 'hover:bg-accent hover:text-accent-foreground',
          )}
          onClick={() => onChange(f)}
        >
          {f}
        </Badge>
      ))}
    </div>
  )
}
