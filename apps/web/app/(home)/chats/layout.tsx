import { ChatList } from '@/components/chat/ChatList';

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-full">
      {/* LEFT: The Chat List (Fixed Width) */}
      <div className="w-96 border-r bg-white dark:bg-gray-900 dark:border-gray-800 flex flex-col h-full z-40">
        <ChatList />
      </div>

      {/* RIGHT: The Conversation Window (Dynamic) */}
      <div className="flex-1 h-full bg-slate-50 dark:bg-gray-950 relative">
        {children}
      </div>
    </div>
  );
}
