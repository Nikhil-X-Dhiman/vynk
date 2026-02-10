'use client';

/**
 * @fileoverview Filter chips row for chat list.
 * @module components/chat/FilterChips
 */

import { Badge } from '@/components/ui/badge';
import type { FilterType } from './types';

const FILTERS: FilterType[] = ['All', 'Unread', 'Favourites', 'Groups'];

interface FilterChipsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}

/**
 * Horizontal row of filter chips for the chat list.
 */
export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {FILTERS.map((f) => (
        <Badge
          key={f}
          variant={active === f ? 'default' : 'secondary'}
          className="cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors hover:bg-opacity-80"
          onClick={() => onChange(f)}
        >
          {f}
        </Badge>
      ))}
    </div>
  );
}
