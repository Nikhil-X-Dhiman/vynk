'use client';

/**
 * @fileoverview Chats Layout Component
 *
 * Provides the split-pane shell for the `/chats` route segment:
 * - **Left panel** – Chat list sidebar (full-width on mobile, fixed 384px on desktop).
 * - **Right panel** – Active conversation window rendered by nested routes.
 *
 * On mobile devices the two panels are mutually exclusive:
 * when a conversation is open (`/chats/[id]`), the list hides and the
 * conversation fills the viewport. Navigating back to `/chats` shows
 * the list again.
 *
 * @module app/(home)/chats/layout
 */

import { usePathname } from 'next/navigation';

import { ChatList } from '@/components/chat/ChatList';
import { cn } from '@/lib/utils/tailwind-helpers';

// ==========================================
// Route Constants
// ==========================================

/** Base path of the chats route (when no conversation is selected). */
const CHATS_BASE_PATH = '/chats' as const;

// ==========================================
// Types
// ==========================================

/** Props for the ChatsLayout component. */
interface ChatsLayoutProps {
  /** Nested route content (conversation window or empty state). */
  children: React.ReactNode;
}

// ==========================================
// Component
// ==========================================

/**
 * Two-panel layout for the chats feature.
 *
 * Determines which panel to display on mobile by comparing the current
 * pathname against the base chats path:
 * - `/chats`       → show list, hide conversation area
 * - `/chats/[id]`  → hide list, show conversation area
 *
 * On `md` breakpoint and above, both panels are always visible.
 *
 * @param props - Layout props containing children.
 * @returns The chats layout JSX element.
 */
export default function ChatsLayout({ children }: Readonly<ChatsLayoutProps>) {
  const pathname = usePathname();

  /** `true` when a specific conversation is active (i.e. path is beyond `/chats`). */
  const isChatOpen = pathname !== CHATS_BASE_PATH;

  return (
    <div className="flex h-full w-full">
      {/* Chat List Panel */}
      <div
        className={cn(
          'z-40 flex h-full w-full flex-col border-r bg-white md:w-96',
          'dark:border-gray-800 dark:bg-gray-900',
          isChatOpen ? 'hidden md:flex' : 'flex',
        )}
      >
        <ChatList />
      </div>

      {/* Conversation Panel */}
      <div
        className={cn(
          'relative h-full flex-1 bg-slate-50 dark:bg-gray-950',
          isChatOpen ? 'block' : 'hidden md:block',
        )}
      >
        {children}
      </div>
    </div>
  );
}
