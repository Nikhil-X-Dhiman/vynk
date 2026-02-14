'use client';

/**
 * @fileoverview Chat Search Bar
 * @module components/chat/ChatSearchBar
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export function ChatSearchBar({
  value,
  onChange,
  placeholder = 'Search chats...',
}: ChatSearchBarProps) {
  return (
    <div className="px-4 pb-2 shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1 transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
