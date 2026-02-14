/**
 * @fileoverview Home Layout Component
 *
 * Root layout for all authenticated (home) routes.
 *
 * @module app/(home)/layout
 */

import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Fixed Sidebar */}
      <aside className="z-50 w-16 shrink-0 border-r bg-white dark:border-gray-800 dark:bg-gray-900">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="relative flex flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
