'use client';

/**
 * @fileoverview Search bar for chat list.
 * @module components/chat/ChatSearchBar
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

/**
 * Search input with icon for filtering conversations or users.
 */
export function ChatSearchBar({
  value,
  onChange,
  placeholder = 'Search chats...',
}: ChatSearchBarProps) {
  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
