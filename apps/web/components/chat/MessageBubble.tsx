'use client';

/**
 * @fileoverview Individual message bubble component.
 * @module components/chat/MessageBubble
 */

import React from 'react';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';
import type { LocalMessage } from '@/lib/db';

interface MessageBubbleProps {
  msg: LocalMessage;
  isMe: boolean;
}

/**
 * Renders a single chat message with status indicators.
 * Memoized to avoid unnecessary re-renders in virtualized lists.
 */
export const MessageBubble = React.memo(function MessageBubble({
  msg,
  isMe,
}: MessageBubbleProps) {
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
