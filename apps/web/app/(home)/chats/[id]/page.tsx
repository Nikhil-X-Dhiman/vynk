/**
 * @fileoverview Conversation Page
 *
 * Renders the `ChatWindow` for a specific conversation ID.
 *
 * @module app/(home)/chats/[id]/page
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow';

interface ConversationParams {
  id: string
}

interface PageProps {
  params: Promise<ConversationParams>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Chat – ${id}`,
  }
}

export default async function ConversationPage({
  params,
}: Readonly<PageProps>) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return <ChatWindow chatId={id} />
}
