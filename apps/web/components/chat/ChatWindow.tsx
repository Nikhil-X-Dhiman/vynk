'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  MoreVertical,
  Search,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  SendHorizontal,
  CheckCheck,
  ArrowLeft,
} from 'lucide-react';
import { useCallStore } from '@/store/use-call-store';
import { cn } from '@/lib/utils/tailwind-helpers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '@/lib/db';
import { getSocket } from '@/lib/services/socket/client';
import { SOCKET_EVENTS } from '@repo/shared';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { normalizeAvatarUrl } from '@/lib/utils/avatar';

// ============ Types ============

interface ChatWindowProps {
  chatId: string;
}

interface ConversationInfo {
  name: string;
  avatar: string | null;
  type: 'private' | 'group' | 'broadcast';
  otherUserId?: string;
}

interface SocketMessage {
  id?: string;
  messageId?: string;
  conversationId: string;
  senderId: string;
  content?: string;
  text?: string;
  timestamp?: number;
}

// ============ Skeleton Component ============

export const ChatWindowSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 h-full bg-background animate-in fade-in duration-500">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'flex w-full',
          i % 2 === 0 ? 'justify-start' : 'justify-end'
        )}
      >
        <Skeleton
          className={cn(
            'h-16 w-2/3 max-w-[300px] rounded-lg',
            i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'
          )}
        />
      </div>
    ))}
  </div>
);

// ============ Chat Header ============

export function ChatHeader({
  conversationInfo,
  onBack,
}: {
  conversationInfo: ConversationInfo | null;
  onBack?: () => void;
}) {
  const { startCall } = useCallStore();

  const name = conversationInfo?.name || 'Loading...';
  const avatar = conversationInfo?.avatar;

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!conversationInfo?.otherUserId) return;

    const callee = {
      id: conversationInfo.otherUserId,
      name: name,
      avatar: avatar ?? undefined,
    };
    startCall(callee, type);
  };

  return (
    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <Link
          href="/chats"
          className="md:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar>
          <AvatarImage
            src={normalizeAvatarUrl(avatar) || undefined}
            alt={name}
            className="object-cover"
          />
          <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {/* Status could be added here later */}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => handleStartCall('video')}
        >
          <Video className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => handleStartCall('audio')}
        >
          <Phone className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Separator
          orientation="vertical"
          className="h-6 mx-2"
        />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

// ============ Message Bubble ============

const MessageBubble = React.memo(
  ({ msg, isMe }: { msg: LocalMessage; isMe: boolean }) => {
    return (
      <div
        className={cn(
          'flex w-full mb-2 transform-gpu px-4',
          isMe ? 'justify-end' : 'justify-start',
        )}
        style={{ contain: 'content' }}
      >
        <div
          className={cn(
            'relative max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all',
            isMe
              ? 'bg-green-100 text-gray-900 dark:bg-green-900 dark:text-gray-100 rounded-tr-none'
              : 'bg-background border rounded-tl-none',
          )}
        >
          <p className="mb-1 leading-relaxed break-words">
            {msg.content || ''}
          </p>
          <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <span>
              {new Date(msg.timestamp || 0).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMe && (
              <span>
                {msg.status === 'pending' ? (
                  <span className="text-muted-foreground animate-pulse">
                    ...
                  </span>
                ) : (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

MessageBubble.displayName = 'MessageBubble';

// ============ Message List ============

import { useVirtualizer } from '@tanstack/react-virtual';

// ============ Message List ============

export interface MessageListHandle {
  scrollToBottom: () => void;
}

export const MessageList = React.forwardRef<
  MessageListHandle,
  {
    messages: LocalMessage[];
    currentUserId?: string;
  }
>(function MessageList({ messages, currentUserId }, ref) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // improved estimation for message bubbles
    overscan: 5,
  });

  const scrollToEnd = useCallback(() => {
    if (messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, {
      align: 'end',
      behavior: 'smooth',
    });
  }, [messages.length, virtualizer]);

  const scrollToEndInstant = useCallback(() => {
    if (messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
  }, [messages.length, virtualizer]);

  React.useImperativeHandle(ref, () => ({
    scrollToBottom: scrollToEnd,
  }));

  // Scroll to bottom when conversation first loads with messages
  const hasInitiallyScrolled = useRef(false);
  useEffect(() => {
    if (!hasInitiallyScrolled.current && messages.length > 0) {
      // Longer delay to ensure virtualizer is ready
      const timer = setTimeout(() => {
        scrollToEndInstant();
        hasInitiallyScrolled.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToEndInstant]);

  // Reset scroll tracking when messages array is cleared
  useEffect(() => {
    if (messages.length === 0) {
      hasInitiallyScrolled.current = false;
    }
  }, [messages.length]);

  return (
    <div
      ref={parentRef}
      className="h-full w-full bg-background overflow-y-auto contain-strict"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const msg = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageBubble
                msg={msg}
                isMe={msg.senderId === currentUserId}
              />
            </div>
          );
        })}
      </div>
      <div className="h-4" />
    </div>
  );
});

// ============ Message Input ============

export interface MessageInputHandle {
  focus: () => void;
}

export const MessageInput = React.forwardRef<
  MessageInputHandle,
  {
    onSend?: (text: string) => void;
    disabled?: boolean;
  }
>(function MessageInput({ onSend, disabled }, ref) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose focus method to parent
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    const text = message;
    setMessage('');
    onSend?.(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-t">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
      >
        <Smile className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
      >
        <Paperclip className="h-6 w-6" />
      </Button>
      <div className="flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type a message"
          className="bg-background border-none shadow-none focus-visible:ring-0"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          autoFocus
        />
      </div>
      {message.trim() ? (
        <Button
          onClick={handleSend}
          size="icon"
          className="rounded-full bg-green-500 text-white hover:bg-green-600"
          disabled={disabled}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
});

// ============ Main Chat Window ============

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const messageListRef = useRef<MessageListHandle>(null);

  // Get conversation info from IndexedDB
  const conversation = useLiveQuery(
    () => db.conversations.where('conversationId').equals(chatId).first(),
    [chatId],
  );

  // Get messages from IndexedDB
  const messages =
    useLiveQuery(
      () =>
        db.messages.where('conversationId').equals(chatId).sortBy('timestamp'),
      [chatId],
    ) ?? [];

  // Get participants to find other user
  const participants =
    useLiveQuery(
      () => db.participants.where('conversationId').equals(chatId).toArray(),
      [chatId],
    ) ?? [];

  // Find the other user in a private chat
  const otherUserId = participants.find((p) => p.userId !== user?.id)?.userId;
  const otherUser = useLiveQuery(
    () => (otherUserId ? db.users.get(otherUserId) : undefined),
    [otherUserId],
  );

  // Build conversation info for header
  const conversationInfo: ConversationInfo | null = conversation
    ? {
        name:
          conversation.type === 'private'
            ? otherUser?.name || conversation.displayName || 'Unknown'
            : conversation.title || 'Group',
        avatar:
          conversation.type === 'private'
            ? otherUser?.avatar || conversation.displayAvatar || null
            : conversation.groupImg || null,
        type: conversation.type,
        otherUserId: otherUserId,
      }
    : null;

  // Subscribe to real-time messages via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('conversation:join', { conversationId: chatId });

    interface SocketMessage {
      id?: string;
      messageId?: string;
      conversationId: string;
      senderId: string;
      content?: string;
      text?: string;
      timestamp?: number;
    }

    const handleNewMessage = async (msg: SocketMessage) => {
      if (msg.conversationId === chatId) {
        // Add message to local DB
        await db.messages.add({
          messageId: msg.id || msg.messageId,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content || msg.text || '',
          status: 'delivered',
          timestamp: msg.timestamp || Date.now(),
        });
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.emit('conversation:leave', { conversationId: chatId });
    };
  }, [chatId]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!user) return;

      const tempId = `temp-${Date.now()}`;
      const newMsg: LocalMessage = {
        messageId: tempId,
        conversationId: chatId,
        senderId: user.id,
        content: text,
        status: 'pending',
        timestamp: Date.now(),
      };

      try {
        // 1. Add to local DB (optimistic update)
        await db.messages.add(newMsg);

        // 2. Emit via socket
        const socket = getSocket();
        socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, {
          conversationId: chatId,
          content: text,
          type: 'text',
        });

        // 3. Queue for sync (in case socket fails)
        await db.enqueue('MESSAGE_SEND', {
          id: tempId,
          conversationId: chatId,
          content: text,
          mediaType: 'text',
          timestamp: Date.now(),
        });

        // 4. Update conversation's last message
        const conv = await db.conversations
          .where('conversationId')
          .equals(chatId)
          .first();

        if (conv) {
          await db.conversations.update(conv.id!, {
            lastMessage: text,
            lastMessageAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Mark message as failed
        const failed = await db.messages
          .where('messageId')
          .equals(tempId)
          .first();
        if (failed) {
          await db.messages.delete(failed.id!);
        }
      } finally {
        // Scroll to bottom after sending
        // Use setTimeout to allow UI to update with new message
        setTimeout(() => {
          messageListRef.current?.scrollToBottom();
        }, 100);
      }
    },
    [chatId, user],
  );

  const isLoading = !conversation;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden preserve-3d">
      <ChatHeader conversationInfo={conversationInfo} />
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <ChatWindowSkeleton />
        ) : (
          <MessageList
            ref={messageListRef}
            messages={messages}
            currentUserId={user?.id}
          />
        )}
      </div>
      {!isLoading && <MessageInput onSend={handleSendMessage} />}
    </div>
  );
}
