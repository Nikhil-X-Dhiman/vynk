/**
 * @fileoverview Chats Empty-State Page
 *
 * Rendered when the user is on `/chats` **without** an active conversation.
 * Displays a friendly placeholder encouraging the user to select a chat.
 *
 * This page is only visible on desktop (≥ md) because on mobile the chat
 * list fills the entire viewport when no conversation is selected.
 *
 * @module app/(home)/chats/page
 */

import type { Metadata } from 'next';

// ==========================================
// Metadata
// ==========================================

export const metadata: Metadata = {
  title: 'Chats',
  description: 'View and manage your conversations on Vynk.',
};

// ==========================================
// Component
// ==========================================

/**
 * Empty-state placeholder for the chats route.
 *
 * Shown in the right panel of the chats layout when no conversation
 * is selected. Provides a welcoming prompt to guide the user.
 *
 * @returns The empty-state JSX element.
 */
export default function ChatsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      {/* Greeting Icon */}
      <span
        className="mb-4 text-5xl"
        role="img"
        aria-label="Waving hand"
      >
        👋
      </span>

      {/* Heading */}
      <h2 className="text-xl font-semibold tracking-tight">Welcome to Vynk</h2>

      {/* Subtext */}
      <p className="mt-1 text-sm">Select a conversation to start messaging</p>
    </div>
  );
}
