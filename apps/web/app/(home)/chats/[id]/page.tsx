// app/(dashboard)/chats/[id]/page.tsx
export default async function ConversationPage({ params }: { params: { id: string } }) {
  // You can fetch data directly here because it's a Server Component!
  // const chatData = await getChatMessages(params.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader chatId={params.id} />

      {/* Messages (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList chatId={params.id} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <MessageInput chatId={params.id} />
      </div>
    </div>
  );
}
