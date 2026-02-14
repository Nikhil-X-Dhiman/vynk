/**
 * @fileoverview Chats Empty State
 *
 * Rendered when no conversation is selected.
 * Visible only on desktop (hidden on mobile via layout).
 *
 * @module app/(home)/chats/page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chats',
  description: 'View and manage your conversations.',
}

export default function ChatsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      <span
        className="mb-4 text-5xl"
        role="img"
        aria-label="Waving hand"
      >
        👋
      </span>
      <h2 className="text-xl font-semibold tracking-tight">Welcome to Vynk</h2>
      <p className="mt-1 text-sm">Select a conversation to start messaging</p>
    </div>
  )
}
