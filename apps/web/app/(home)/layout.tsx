import { Sidebar } from '@/components/layout/Sidebar';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden dark:bg-gray-950">
      {/* 1. Fixed Skinny Sidebar */}
      <aside className="w-16 flex-shrink-0 border-r bg-white dark:bg-gray-900 dark:border-gray-800 z-50">
        <Sidebar />
      </aside>

      {/* 2. The Dynamic Content (Chats List + Window) */}
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
