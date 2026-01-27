'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Search, SquarePen, EllipsisVertical, UserPlus, X, MessageSquareDashed } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserConversations } from '@/app/actions/user-conversations';
import { getOnlineUsers } from '@/app/actions/online-users';
import { startConversation } from '@/app/actions/conversations';
import { useRouter } from 'next/navigation';

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
  const [chats, setChats] = useState<any[]>([]); // Use appropriate type if available
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [onlineUsersSearchQuery, setOnlineUsersSearchQuery] = useState('');
  const params = useParams();
  const router = useRouter(); // Initialize router
  const selectedId = params?.id;

  const handleToggleOnlineUsers = async () => {
    if (!showOnlineUsers) {
      const res = await getOnlineUsers();
      if (res.success && res.data) {
        setOnlineUsers(res.data);
      }
    }
    setShowOnlineUsers(!showOnlineUsers);
  };

  const handleUserClick = async (userId: string) => {
    const res = await startConversation(userId);
    if (res.success && res.data) {
      router.push(`/chats/${res.data}`);
      setShowOnlineUsers(false);
    }
  };

  useEffect(() => {
    const loadChats = async () => {
      try {
        const result = await getUserConversations();
        if (result.success && result.data) {
          setChats(result.data);
        }
      } catch (error) {
        console.error('Failed to load chats', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChats();
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
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
    <div className="flex h-full w-full flex-col bg-background relative">
      {/* Header */}
      {!showOnlineUsers && (
        <>
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
        </>
      )}

      {/* List */}
      <div className="flex-1 overflow-hidden preserve-3d relative">
        {showOnlineUsers ? (
          <div className="absolute inset-0 bg-background z-10 overflow-y-auto w-full h-full">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b">
                 <h3 className="px-4 py-3 font-semibold text-muted-foreground w-full">
                  Online Users ({onlineUsers.length})
                </h3>
                <div className="px-4 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search online users"
                        className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1"
                        value={onlineUsersSearchQuery}
                        onChange={(e) => setOnlineUsersSearchQuery(e.target.value)}
                      />
                    </div>
                 </div>
            </div>

            <div className="flex flex-col">
              {onlineUsers
                .filter(user => user.name.toLowerCase().includes(onlineUsersSearchQuery.toLowerCase()))
                .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                 <div className="p-4 text-center text-muted-foreground">
                     No users online
                 </div>
              )}
            </div>
          </div>
        ) : (
          isLoading ? (
            <ChatListSkeleton />
          ) : filteredChats.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground animate-in fade-in duration-500">
                <MessageSquareDashed className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm opacity-70">Start a new chat to connect</p>
             </div>
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
          )
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="absolute bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-30 transition-all duration-300 hover:scale-105 bg-slate-600 text-white hover:bg-slate-700 border-2 border-white dark:border-gray-900"
        size="icon"
        onClick={handleToggleOnlineUsers}
      >
        {showOnlineUsers ? (
            <X className="h-6 w-6" />
        ) : (
            <UserPlus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
