'use client';

/**
 * @fileoverview Virtualized message list using @tanstack/react-virtual.
 * @module components/chat/MessageList
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LocalMessage } from '@/lib/db';
import { MessageBubble } from './MessageBubble';
import type { MessageListHandle } from './types';

interface MessageListProps {
  messages: LocalMessage[];
  currentUserId?: string;
}

/**
 * Virtualized scrollable message list. Exposes `scrollToBottom`
 * via imperative handle for programmatic scrolling.
 */
export const MessageList = React.forwardRef<MessageListHandle, MessageListProps>(
  function MessageList({ messages, currentUserId }, ref) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: messages.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 50,
      overscan: 5,
    });

    // ── Scroll helpers ────────────────────────────────────────────

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

    // ── Initial scroll ────────────────────────────────────────────

    const hasInitiallyScrolled = useRef(false);

    useEffect(() => {
      if (!hasInitiallyScrolled.current && messages.length > 0) {
        const timer = setTimeout(() => {
          scrollToEndInstant();
          hasInitiallyScrolled.current = true;
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [messages.length, scrollToEndInstant]);

    // Reset when messages are cleared (conversation change)
    useEffect(() => {
      if (messages.length === 0) {
        hasInitiallyScrolled.current = false;
      }
    }, [messages.length]);

    // ── Render ────────────────────────────────────────────────────

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
  },
);
