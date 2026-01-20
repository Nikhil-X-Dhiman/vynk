'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, SquarePen, EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';
import { MOCK_CHATS } from '@/lib/mock-data';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

type FilterType = 'All' | 'Unread' | 'Favourites' | 'Groups';

const FilterChip = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <Badge
    variant={isActive ? 'default' : 'secondary'}
    className="cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors hover:bg-opacity-80"
    onClick={onClick}
  >
    {label}
  </Badge>
);

export const ChatListSkeleton = () => (
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

const ChatListItem = React.memo(({ chat, isSelected }: { chat: any; isSelected: boolean }) => (
  <Link
    href={isSelected ? '/chats' : `/chats/${chat.id}`}
    className={cn(
      'flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer transform-gpu',
      isSelected && 'bg-accent'
    )}
    style={{ contain: 'content' }} // Isolated rendering for performance
  >
    <div className="h-12 w-12 flex-shrink-0"> {/* Fixed container to prevent jump */}
      <Avatar className="h-12 w-12">
        <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
        <AvatarFallback>{chat.name[0]}</AvatarFallback>
      </Avatar>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <h3 className="font-semibold text-foreground truncate">
          {chat.name}
        </h3>
        <span
          className={cn(
            'text-xs',
            chat.unreadCount > 0
              ? 'text-primary font-bold'
              : 'text-muted-foreground'
          )}
        >
          {chat.time}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground truncate pr-2">
          {chat.lastMessage}
        </p>
        {chat.unreadCount > 0 && (
          <Badge variant="default" className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] p-0">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
    </div>
  </Link>
));

ChatListItem.displayName = 'ChatListItem';

export function ChatList() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const selectedId = params?.id;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredChats = useMemo(() => {
    return MOCK_CHATS.filter((chat) => {
      if (
        searchQuery &&
        !chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // 2. Filter Tabs
      if (filter === 'Unread') return chat.unreadCount > 0;
      if (filter === 'Groups') return chat.isGroup;
      if (filter === 'Favourites') return false;
      return true;
    });
  }, [filter, searchQuery]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-foreground">
          Chats
        </h1>
        <div className="flex gap-2 text-muted-foreground">
          <Button variant="ghost" size="icon" className="rounded-full">
            <SquarePen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <EllipsisVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search or ask Meta AI"
            className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
        {(['All', 'Unread', 'Favourites', 'Groups'] as FilterType[]).map((f) => (
          <FilterChip
            key={f}
            label={f}
            isActive={filter === f}
            onClick={() => setFilter(f)}
          />
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden preserve-3d">
        {isLoading ? (
          <ChatListSkeleton />
        ) : (
          <Virtuoso
            style={{ height: '100%', outline: 'none' }}
            data={filteredChats}
            increaseViewportBy={500}
            computeItemKey={(_, chat) => chat.id}
            itemContent={(index, chat) => (
              <ChatListItem
                chat={chat}
                isSelected={selectedId === chat.id}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
