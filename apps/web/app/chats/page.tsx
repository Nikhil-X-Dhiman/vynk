'use client';

import { joinRoom, sendMessage } from '@/lib/services/socket/emitters';
import { onMessageReceived } from '@/lib/services/socket/listeners';
import { useEffect } from 'react';
// import { joinRoom, sendMessage } from '@/lib/socket/emitters';
// import { onMessageReceived } from '@/lib/socket/listeners';

export default function ChatPage({ params }) {
  useEffect(() => {
    joinRoom(params.id);

    onMessageReceived((msg) => {
      console.log('New message:', msg);
    });
  }, [params.id]);

  return (
    <button
      onClick={() => sendMessage({ conversationId: params.id, text: 'Hello' })}
    >
      Send
    </button>
  );
}
