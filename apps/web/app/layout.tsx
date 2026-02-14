/**
 * @fileoverview Root Layout Component
 *
 * The root layout wraps all pages in the application and provides:
 * - Font configuration (Geist Sans & Mono)
 * - Theme provider for dark/light mode
 * - Session provider for authentication state
 * - Toast notifications
 * - Service worker registration
 * - PWA manifest and meta tags
 *
 * @module app/layout
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/layout}
 */

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import SessionProvider from '@/components/providers/SessionProvider';
import { Toaster } from '@/components/ui/sonner';
import SWRegister from '@/components/layout/ServiceWorkerRegister';
import { checkServerAuth } from '@/lib/auth/check-server-auth';

import './globals.css';

// ==========================================
// Font Configuration
// ==========================================

/**
 * Geist Sans - Primary font for body text.
 * @see {@link https://vercel.com/font}
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Geist Mono - Monospace font for code blocks.
 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// ==========================================
// Metadata Configuration
// ==========================================

/**
 * Application metadata for SEO and social sharing.
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/generate-metadata}
 */
export const metadata: Metadata = {
  title: {
    default: 'Vynk - Real-time Messaging',
    template: '%s | Vynk',
  },
  description: 'Vynk is a modern real-time messaging application.',
  keywords: ['messaging', 'chat', 'real-time', 'pwa'],
  authors: [{ name: 'Vynk Team' }],
  creator: 'Vynk',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vynk',
  },
  formatDetection: {
    telephone: true,
  },
}

/**
 * Viewport configuration for responsive design and PWA.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ==========================================
// Layout Props
// ==========================================

/**
 * Props for the RootLayout component.
 */
interface RootLayoutProps {
  /** Child components to render within the layout */
  children: React.ReactNode;
}

// ==========================================
// Root Layout Component
// ==========================================

/**
 * Root layout component that wraps the entire application.
 *
 * Execution order:
 * 1. Checks server-side authentication
 * 2. Renders providers in correct nesting order
 * 3. Injects global UI components (Toaster, SWRegister)
 *
 * @param props - Layout props containing children
 * @returns The root layout JSX
 */
export default async function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  // Fetch session on the server for initial hydration
  const { session } = await checkServerAuth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider initialSession={session}>
            {/* Main application content */}
            {children}

            {/* Global UI components */}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
            />
            <SWRegister />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
