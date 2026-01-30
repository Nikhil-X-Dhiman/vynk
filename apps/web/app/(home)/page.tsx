'use client';

import { joinRoom, sendMessage } from '@/lib/services/socket/emitters';
import { onMessageReceived } from '@/lib/services/socket/listeners';
import { use, useEffect } from 'react';
// import { joinRoom, sendMessage } from '@/lib/socket/emitters';
// import { onMessageReceived } from '@/lib/socket/listeners';

export default function ChatPage({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = use(params);

  useEffect(() => {
    // joinRoom(id);

    onMessageReceived((msg) => {
      console.log('New message:', msg);
    });
  }, [id]);

  return (
    // <button
    //   onClick={() => sendMessage({ conversationId: id, text: 'Hello' })}
    // >
    //   Send
    // </button>
    <p>hello</p>
  );
}
