'use client';

/**
 * @fileoverview Message input bar.
 *
 * Capabilities:
 * - Text input handling
 * - Send via Enter key or button
 * - Emoji picker integration
 * - Disabled state support (e.g. when offline)
 *
 * @module components/chat/MessageInput
 */

import React, { useState, useRef, useImperativeHandle } from 'react'
import { Smile, Paperclip, Mic, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'
import type { MessageInputHandle } from './types';

interface MessageInputProps {
  onSend?: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = React.forwardRef<
  MessageInputHandle,
  MessageInputProps
>(function MessageInput({ onSend, disabled }, ref) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme()

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    const text = message;
    setMessage('');
    onSend?.(text);
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-t">
      {/* Emoji Picker */}
      <Popover
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            disabled={disabled}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-full p-0 border-none bg-transparent shadow-none"
        >
          <EmojiPicker
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
          />
        </PopoverContent>
      </Popover>

      {/* Attachment (Visual Only for now) */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        disabled={disabled}
      >
        <Paperclip className="h-6 w-6" />
      </Button>

      {/* Text Input */}
      <div className="flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder={disabled ? 'You are offline' : 'Type a message'}
          className="bg-background border-none shadow-none focus-visible:ring-0"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Send / Mic Button */}
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
          disabled={disabled}
        >
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
});
