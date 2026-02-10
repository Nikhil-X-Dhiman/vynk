'use client';

/**
 * @fileoverview Chat Window — Main Orchestrator
 *
 * Thin composition layer that wires hooks and sub-components together.
 * All business logic lives in the hooks; all UI in the sub-components.
 *
 * @module components/chat/ChatWindow
 */

import { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/auth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useConversationInfo } from '@/hooks/useConversationInfo';
import { useSocketMessages } from '@/hooks/useSocketMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { ChatHeader } from './ChatHeader';
import { ChatWindowSkeleton } from './ChatWindowSkeleton';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { MessageListHandle } from './types';

// ==========================================
// Component
// ==========================================

interface ChatWindowProps {
  chatId: string;
}

/**
 * Main chat window that renders the header, message list, and input bar
 * for a single conversation.
 */
export function ChatWindow({ chatId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const messageListRef = useRef<MessageListHandle>(null);

  // Data
  const { conversationInfo, isLoading } = useConversationInfo(chatId);

  const messages =
    useLiveQuery(
      () =>
        db.messages.where('conversationId').equals(chatId).sortBy('timestamp'),
      [chatId],
    ) ?? [];

  // Real-time subscription
  useSocketMessages(chatId, isOnline);

  // Message sending
  const sendMessage = useSendMessage(chatId, isOnline);

  const handleSend = async (text: string) => {
    await sendMessage(text);
    // Scroll to bottom after sending (delay for UI update)
    setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
  };

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

      {!isLoading && <MessageInput onSend={handleSend} />}
    </div>
  );
}
