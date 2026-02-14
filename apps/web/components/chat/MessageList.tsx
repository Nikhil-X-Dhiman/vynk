'use client';

/**
 * @fileoverview Virtualized Message List
 *
 * Uses @tanstack/react-virtual to efficiently render large lists of messages.
 * Handles auto-scrolling to bottom on new messages.
 *
 * @module components/chat/MessageList
 */

import React, {
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LocalMessage } from '@/lib/db';
import { MessageBubble } from './MessageBubble';
import type { MessageListHandle } from './types';

interface MessageListProps {
  messages: LocalMessage[];
  currentUserId?: string;
}

export const MessageList = React.forwardRef<MessageListHandle, MessageListProps>(
  function MessageList({ messages, currentUserId }, ref) {
    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
      count: messages.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 60, // approximate height of a message bubble
      overscan: 5,
    })

    const scrollToEnd = useCallback(
      (behavior: 'auto' | 'smooth' = 'smooth') => {
        if (messages.length === 0) return
        virtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior,
        })
      },
      [messages.length, virtualizer],
    )

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => scrollToEnd('smooth'),
    }))

    // Initial scroll to bottom on mount
    const mountedRef = useRef(false)
    useEffect(() => {
      if (!mountedRef.current && messages.length > 0) {
        // Immediate scroll on first load
        scrollToEnd('auto')
        mountedRef.current = true
      }
    }, [messages.length, scrollToEnd])

    return (
      <div
        ref={parentRef}
        className="h-full w-full bg-background overflow-y-auto contain-strict scroll-smooth"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const msg = messages[virtualItem.index]
            if (!msg) return null

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
                className="px-4 py-1"
              >
                <MessageBubble
                  msg={msg}
                  isMe={msg.senderId === currentUserId}
                />
              </div>
            )
          })}
        </div>
        {/* Spacer for bottom overlap */}
        <div className="h-4" />
      </div>
    )
  },
);
