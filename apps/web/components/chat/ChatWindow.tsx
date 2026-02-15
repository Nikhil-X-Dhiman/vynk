'use client';

/**
 * @fileoverview Chat Window — Main Orchestrator
 *
 * Orchestrates the chat view by composing hooks for data and logic
 * with presentational components.
 *
 * @module components/chat/ChatWindow
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/core'
import type { LocalMessage } from '@/lib/db/types'
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

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const isOnline = useNetworkStatus()
  const messageListRef = useRef<MessageListHandle>(null)

  // 1. Resolve Conversation Info & Existence
  const { conversationInfo, isLoading, exists } = useConversationInfo(chatId)

  // Redirect if not found (after loading)
  useEffect(() => {
    if (!isLoading && !exists) {
      router.push('/chats')
    }
  }, [isLoading, exists, router])

  // 2. Fetch Messages (Live)
  // We sort by timestamp to ensure correct order
  const messages =
    useLiveQuery(
      () =>
        db.messages.where('conversationId').equals(chatId).sortBy('timestamp'),
      [chatId],
    ) ?? []

  // 3. Socket Subscription
  // Handles real-time incoming messages
  useSocketMessages(chatId, isOnline)

  // 4. Sending Logic
  const sendMessage = useSendMessage(chatId, isOnline)

  const handleSend = async (text: string) => {
    await sendMessage(text)
    // Scroll to bottom after sending
    // We add a tiny delay to allow the new message to be rendered in the virtual list
    setTimeout(() => {
      messageListRef.current?.scrollToBottom()
    }, 50)
  }

  // Loading / Redirecting State
  if (!isLoading && !exists) {
    return <ChatWindowSkeleton />
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden preserve-3d">
      {/* Header */}
      <ChatHeader conversationInfo={conversationInfo} />

      {/* Message List */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <ChatWindowSkeleton />
        ) : (
          <MessageList
            ref={messageListRef}
            messages={messages as LocalMessage[]}
            currentUserId={user?.id}
          />
        )}
      </div>

      {/* Input Area */}
      {/* Only show input if loaded. Disable if offline (optional but good UX) */}
      {!isLoading && (
        <MessageInput
          onSend={handleSend}
          disabled={!isOnline}
        />
      )}
    </div>
  )
}
