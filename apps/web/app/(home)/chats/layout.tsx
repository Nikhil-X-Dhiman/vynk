// app/(dashboard)/chats/layout.tsx

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-full">
      {/* LEFT: The Chat List (Fixed Width) */}
      <div className="w-80 border-r bg-white flex flex-col h-full">
         <div className="p-4 border-b font-bold text-xl">Chats</div>
         <div className="flex-1 overflow-y-auto">
            <ChatList />
         </div>
      </div>

      {/* RIGHT: The Conversation Window (Dynamic) */}
      <div className="flex-1 h-full bg-slate-50 relative">
        {children}
      </div>
    </div>
  );
}
