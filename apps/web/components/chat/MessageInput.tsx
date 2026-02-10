'use client';

/**
 * @fileoverview Message input bar with send/mic toggle.
 * @module components/chat/MessageInput
 */

import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Mic, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MessageInputHandle } from './types';

interface MessageInputProps {
  onSend?: (text: string) => void;
  disabled?: boolean;
}

/**
 * Input bar for composing and sending messages.
 * Toggles between mic and send button based on input state.
 * Exposes `focus()` via imperative handle.
 */
export const MessageInput = React.forwardRef<
  MessageInputHandle,
  MessageInputProps
>(function MessageInput({ onSend, disabled }, ref) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
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
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Smile className="h-6 w-6" />
      </Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground">
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
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Mic className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
});
