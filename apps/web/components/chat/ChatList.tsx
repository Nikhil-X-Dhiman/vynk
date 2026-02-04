'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import {
  Search,
  SquarePen,
  EllipsisVertical,
  UserPlus,
  X,
  MessageSquareDashed,
} from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalConversation, LocalUser } from '@/lib/db';
import { startConversation } from '@/app/actions/conversations';
import { normalizeAvatarUrl } from '@/lib/utils/avatar';

// ============ Types ============

type FilterType = 'All' | 'Unread' | 'Favourites' | 'Groups';

interface EnrichedConversation extends LocalConversation {
  name: string;
  avatar: string | null;
  time: string;
}

// ============ Sub-Components ============

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

const ChatListItem = React.memo(
  ({
    chat,
    isSelected,
  }: {
    chat: EnrichedConversation;
    isSelected: boolean;
  }) => (
    <Link
      href={isSelected ? '/chats' : `/chats/${chat.conversationId}`}
      className={cn(
        'flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer transform-gpu',
        isSelected && 'bg-accent',
      )}
      style={{ contain: 'content' }}
    >
      <div className="h-12 w-12 shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={chat.avatar || undefined}
            alt={chat.name}
            className="object-cover"
          />
          <AvatarFallback>
            {chat.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
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
                : 'text-muted-foreground',
            )}
          >
            {chat.time}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {chat.lastMessage || 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <Badge
              variant="default"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] p-0"
            >
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  ),
);

ChatListItem.displayName = 'ChatListItem';

const UserListItem = React.memo(
  ({
    user,
    onClick,
  }: {
    user: LocalUser;
    onClick: (userId: string) => void;
  }) => (
    <div
      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent cursor-pointer"
      onClick={() => onClick(user.id)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={normalizeAvatarUrl(user.avatar) || undefined}
          alt={user.name}
        />
        <AvatarFallback>{user.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
      </div>
    </div>
  )
);

UserListItem.displayName = 'UserListItem';

// ============ Main Component ============

export function ChatList() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const params = useParams();
  const router = useRouter();
  const selectedId = params?.id as string | undefined;

  // ============ Data Queries (useLiveQuery) ============

  // Get all users from IndexedDB
  const allUsers = useLiveQuery(() => db.users.orderBy('name').toArray()) ?? [];

  // Get all conversations from IndexedDB
  const rawConversations =
    useLiveQuery(() =>
      db.conversations.orderBy('updatedAt').reverse().toArray(),
    ) ?? [];

  // Check if initial sync is completed
  const isSyncCompleted =
    useLiveQuery(() => db.isInitialSyncCompleted()) ?? false;

  // ============ Derived Data ============

  // Enrich conversations with display data
  const enrichedConversations: EnrichedConversation[] = useMemo(() => {
    return rawConversations.map((conv) => ({
      ...conv,
      name: conv.displayName || conv.title || 'Unknown',
      avatar: normalizeAvatarUrl(conv.displayAvatar || conv.groupImg),
      time: conv.lastMessageAt
        ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
    }));
  }, [rawConversations]);

  // Filter conversations based on search and filter type
  const filteredConversations = useMemo(() => {
    return enrichedConversations.filter((conv) => {
      // Search filter
      if (
        searchQuery &&
        !conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Tab filters
      if (filter === 'Unread') return conv.unreadCount > 0;
      if (filter === 'Groups') return conv.type === 'group';
      if (filter === 'Favourites') return false; // Not implemented
      return true;
    });
  }, [enrichedConversations, filter, searchQuery]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
    );
  }, [allUsers, userSearchQuery]);

  // ============ Handlers ============

  const handleToggleUsersView = useCallback(() => {
    setShowAllUsers((prev) => !prev);
    setUserSearchQuery('');
  }, []);

  const handleUserClick = useCallback(
    async (userId: string) => {
      if (isCreatingConversation) return;
      setIsCreatingConversation(true);

      try {
        // First, try to create a virtual conversation locally
        const virtualConvId = await db.createVirtualConversation(
          userId,
          // We need current user ID - this requires the AuthStore
          // For now, we'll call the server action which handles this
          '',
        );

        if (virtualConvId && !virtualConvId.startsWith('virtual-')) {
          // Existing conversation found, navigate to it
          router.push(`/chats/${virtualConvId}`);
          setShowAllUsers(false);
          return;
        }

        // Call server to start/find conversation
        const res = await startConversation(userId);
        if (res.success && res.data) {
          // If we had a virtual conversation, persist it
          if (virtualConvId) {
            await db.persistVirtualConversation(virtualConvId, res.data);
          }
          router.push(`/chats/${res.data}`);
          setShowAllUsers(false);
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
      } finally {
        setIsCreatingConversation(false);
      }
    },
    [router, isCreatingConversation],
  );

  // ============ Render ============

  const isLoading = !isSyncCompleted && rawConversations.length === 0;

  return (
    <div className="flex h-full w-full flex-col bg-background relative">
      {/* Header - Only show when not in users view */}
      {!showAllUsers && (
        <>
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-2xl font-bold text-foreground">Chats</h1>
            <div className="flex gap-2 text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <SquarePen className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
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
                placeholder="Search chats..."
                className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
            {(['All', 'Unread', 'Favourites', 'Groups'] as FilterType[]).map(
              (f) => (
                <FilterChip
                  key={f}
                  label={f}
                  isActive={filter === f}
                  onClick={() => setFilter(f)}
                />
              ),
            )}
          </div>
        </>
      )}

      {/* Main List Area */}
      <div className="flex-1 overflow-hidden preserve-3d relative">
        {showAllUsers ? (
          // Users View
          <div className="absolute inset-0 bg-background z-10 overflow-y-auto w-full h-full">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-20 border-b">
              <h3 className="px-4 py-3 font-semibold text-muted-foreground w-full">
                All Users ({filteredUsers.length})
              </h3>
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 bg-secondary/50 border-none shadow-none focus-visible:ring-1"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              {filteredUsers.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={handleUserClick}
                />
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  {allUsers.length === 0
                    ? 'Loading users...'
                    : 'No users found'}
                </div>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <ChatListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground animate-in fade-in duration-500">
            <MessageSquareDashed className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm opacity-70">Start a new chat to connect</p>
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%', outline: 'none' }}
            data={filteredConversations}
            increaseViewportBy={500}
            computeItemKey={(_, chat) => chat.conversationId}
            itemContent={(_, chat) => (
              <ChatListItem
                chat={chat}
                isSelected={selectedId === chat.conversationId}
              />
            )}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="absolute bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-30 transition-all duration-300 hover:scale-105 bg-slate-600 text-white hover:bg-slate-700 border-2 border-white dark:border-gray-900"
        size="icon"
        onClick={handleToggleUsersView}
        disabled={isCreatingConversation}
      >
        {showAllUsers ? (
          <X className="h-6 w-6" />
        ) : (
          <UserPlus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
