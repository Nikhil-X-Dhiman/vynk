/**
 * @fileoverview Chats Layout
 *
 * Handles responsiveness between chat list and conversation view.
 *
 * @module app/(home)/chats/layout
 */

'use client'

import { usePathname } from 'next/navigation'
import { ChatList } from '@/components/chat/ChatList'
import { cn } from '@/lib/utils/tailwind-helpers'

const CHATS_BASE_PATH = '/chats'

export default function ChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isChatOpen = pathname !== CHATS_BASE_PATH

  return (
    <div className="flex h-full w-full">
      {/* Chat List (Hidden on mobile if chat is open) */}
      <div
        className={cn(
          'z-40 flex h-full w-full flex-col border-r bg-white md:w-96',
          'dark:border-gray-800 dark:bg-gray-900',
          isChatOpen ? 'hidden md:flex' : 'flex',
        )}
      >
        <ChatList />
      </div>

      {/* Conversation Area (Hidden on mobile if no chat selected) */}
      <div
        className={cn(
          'relative h-full flex-1 bg-slate-50 dark:bg-gray-950',
          isChatOpen ? 'block' : 'hidden md:block',
        )}
      >
        {children}
      </div>
    </div>
  )
}
