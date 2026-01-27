'use client';

import { ChatList } from '@/components/chat/ChatList';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/tailwind-helpers';

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatOpen = pathname !== '/chats';

  return (
    <div className="flex w-full h-full">
      {/* LEFT: The Chat List */}
      <div
        className={cn(
            "w-full md:w-96 border-r bg-white dark:bg-gray-900 dark:border-gray-800 flex flex-col h-full z-40",
            isChatOpen ? "hidden md:flex" : "flex"
        )}
      >
        <ChatList />
      </div>

      {/* RIGHT: The Conversation Window */}
      <div
        className={cn(
            "flex-1 h-full bg-slate-50 dark:bg-gray-950 relative",
            !isChatOpen ? "hidden md:block" : "block"
        )}
      >
        {children}
      </div>
    </div>
  );
}
