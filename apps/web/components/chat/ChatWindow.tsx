'use client';

import React, { useState, useRef, useEffect, useOptimistic } from 'react';
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
} from 'lucide-react';
import { useCallStore } from '@/store/use-call-store';
import { cn } from '@/lib/utils/tailwind-helpers';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// --- MOCK DATA ---
const MOCK_MESSAGES = Array.from({ length: 50 }, (_, i) => ({
  id: `msg-${i}`,
  text: i % 2 === 0 ? `Hello there! This is message ${i}` : `I am doing great, standard reply ${i}`,
  sender: i % 2 === 0 ? 'them' : 'me',
  timestamp: '10:30 AM',
  status: 'read',
}));

// --- SKELETON ---

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

// --- COMPONENTS ---

import { MOCK_CHATS } from '@/lib/mock-data';

export function ChatHeader({ chatId }: { chatId: string }) {
  const { startCall } = useCallStore();
  const chatUser = MOCK_CHATS.find(c => c.id === chatId);

  const handleStartCall = (type: 'audio' | 'video') => {
      if (!chatUser) return;

      const callee = {
          id: chatUser.id,
          name: chatUser.name,
          avatar: chatUser.avatar
      };
      startCall(callee, type);
  };

  if (!chatUser) return null; // Or skeleton

  return (
    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={chatUser.avatar} alt={chatUser.name} className="object-cover" />
          <AvatarFallback>{chatUser.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">
            {chatUser.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {chatUser.isOnline ? 'Online' : 'Offline'}
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
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

const MessageBubble = React.memo(({ msg }: { msg: any }) => {
  const isMe = msg.sender === 'me';
  return (
    <div
      className={cn(
        'flex w-full mb-2 transform-gpu px-4', // Base horizontal padding for all
        isMe ? 'justify-end' : 'justify-start'
      )}
      style={{ contain: 'content' }} // Isolation for better render performance including paint containment
    >
      <div
        className={cn(
          'relative max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all',
          isMe
            ? 'bg-green-100 text-gray-900 dark:bg-green-900 dark:text-gray-100 rounded-tr-none'
            : 'bg-background border rounded-tl-none'
        )}
      >
        <p className="mb-1 leading-relaxed break-words">{msg.text}</p>
        <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>{msg.timestamp}</span>
          {isMe && (
            <span>
               {msg.status === 'sending' ? (
                   <span className="text-muted-foreground animate-pulse">...</span>
               ) : (
                   <CheckCheck className="h-3 w-3 text-blue-500" />
               )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export function MessageList({ messages }: { messages: any[] }) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const FooterView = () => <div className="h-4" />; // Bottom margin for the last bubble

  return (
    <div className="h-full w-full bg-background overflow-hidden relative">
      <Virtuoso
        ref={virtuosoRef}
        className="overscroll-y-none"
        style={{ height: '100%', outline: 'none' }}
        data={messages}
        components={{
          Footer: FooterView,
        }}
        initialTopMostItemIndex={messages.length - 1}
        followOutput={'auto'}
        increaseViewportBy={800} // Significant overscan to prevent jitter on appearance
        itemContent={(index, msg) => <MessageBubble msg={msg} />}
      />
    </div>
  );
}

export function MessageInput({ onSend }: { onSend?: (text: string) => void }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend?.(message);
    setMessage('');
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-t">
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Smile className="h-6 w-6" />
      </Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Paperclip className="h-6 w-6" />
      </Button>
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Type a message"
          className="bg-background border-none shadow-none focus-visible:ring-0"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
      </div>
      {message.trim() ? (
        <Button
          onClick={handleSend}
          size="icon"
          className="rounded-full bg-green-500 text-white hover:bg-green-600"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

export function ChatWindow({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [isLoading, setIsLoading] = useState(true);
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        messages,
        (state, newMessage: any) => [...state, newMessage]
    );

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 1200); // Simulated delay
        return () => clearTimeout(timer);
    }, [chatId]);

    const handleSendMessage = async (text: string) => {
        const newMsg = {
            id: `temp-${Date.now()}`,
            text,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending'
        };
        addOptimisticMessage(newMsg);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background overflow-hidden preserve-3d">
            <ChatHeader chatId={chatId} />
            <div className="flex-1 overflow-hidden relative">
                {isLoading ? <ChatWindowSkeleton /> : <MessageList messages={optimisticMessages} />}
            </div>
            {!isLoading && <MessageInput onSend={handleSendMessage} />}
        </div>
    );
}
