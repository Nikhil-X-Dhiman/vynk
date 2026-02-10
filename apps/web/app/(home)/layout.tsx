/**
 * @fileoverview Home Layout Component
 *
 * Root layout for all authenticated (home) routes. Provides a two-column
 * structure: a fixed narrow sidebar for navigation and a flexible main
 * content area that renders nested route segments.
 *
 * Route segments nested under `(home)`:
 * - `/chats`      – Chat list and conversation windows
 * - `/calls`      – Call history
 * - `/settings`   – User settings
 *
 * @module app/(home)/layout
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/layout}
 */

import type { Metadata } from 'next';

import { Sidebar } from '@/components/layout/Sidebar';

// ==========================================
// Metadata
// ==========================================

/**
 * Page metadata — inherits the template from root layout.
 */
export const metadata: Metadata = {
  title: 'Home',
};

// ==========================================
// Types
// ==========================================

/** Props for the HomeLayout component. */
interface HomeLayoutProps {
  /** Nested route content rendered in the main area. */
  children: React.ReactNode;
}

// ==========================================
// Component
// ==========================================

/**
 * Authenticated shell layout.
 *
 * Renders a fixed sidebar on the left (w-16) and a full-width main area
 * that stretches to fill the remaining viewport. Both sections are
 * overflow-hidden so that child routes manage their own scrolling.
 *
 * @param props - Layout props containing children.
 * @returns The home layout JSX element.
 */
export default function HomeLayout({ children }: Readonly<HomeLayoutProps>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Fixed Sidebar Navigation */}
      <aside
        className="z-50 w-16 shrink-0 border-r bg-white dark:border-gray-800 dark:bg-gray-900"
        aria-label="Main navigation"
      >
        <Sidebar />
      </aside>

      {/* Dynamic Content Area */}
      <main className="relative flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
