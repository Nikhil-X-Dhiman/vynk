
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-0 h-screen w-full bg-gray-100 overflow-hidden">
      {/* 1. Fixed Skinny Sidebar */}
      <aside className="w-16 flex-shrink-0 border-r bg-white">
        <Sidebar />
      </aside>

      {/* 2. The Dynamic Content (Chats List + Window) */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
