/**
 * @fileoverview Conversation Page
 *
 * Dynamic route segment that renders a single chat conversation.
 * The conversation ID is extracted from the URL params and passed
 * to the `ChatWindow` component which handles real-time messaging.
 *
 * Next.js 15+ provides params as a `Promise`, so the page component
 * is `async` and awaits the resolved params.
 *
 * @module app/(home)/chats/[id]/page
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page}
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ChatWindow } from '@/components/chat/ChatWindow';

// ==========================================
// Types
// ==========================================

/** Route parameters for the conversation page. */
interface ConversationParams {
  /** Unique identifier for the conversation. */
  id: string;
}

/** Props injected by Next.js for this dynamic route. */
interface ConversationPageProps {
  /** Async route parameters (Next.js 15+ pattern). */
  params: Promise<ConversationParams>;
}

// ==========================================
// Metadata
// ==========================================

/**
 * Generates dynamic metadata for the conversation page.
 *
 * @param props - Page props containing async params.
 * @returns Metadata object with a conversation-specific title.
 */
export async function generateMetadata({
  params,
}: ConversationPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Chat – ${id}`,
  };
}

// ==========================================
// Page Component
// ==========================================

/**
 * Renders the chat window for a specific conversation.
 *
 * Validates the route param before rendering. If the `id` is missing
 * or empty, the user is shown a 404 page via `notFound()`.
 *
 * @param props - Page props containing async route params.
 * @returns The conversation page JSX element.
 */
export default async function ConversationPage({
  params,
}: Readonly<ConversationPageProps>) {
  const { id } = await params;

  // Guard: ensure the conversation ID is present
  if (!id) {
    notFound();
  }

  return <ChatWindow chatId={id} />;
}
