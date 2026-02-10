/**
 * @fileoverview 404 Not Found Page
 *
 * Custom 404 error page that provides a user-friendly experience
 * when a page is not found. Shows contextual actions based on auth state.
 *
 * @module app/not-found
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/not-found}
 */

import Link from 'next/link';
import { HomeIcon, MessageCircle, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { checkServerAuth } from '@/lib/auth/check-server-auth';

// ==========================================
// Constants
// ==========================================

/**
 * Navigation routes based on authentication state.
 */
const ROUTES = {
  authenticated: {
    href: '/chats',
    label: 'Go to Chats',
    icon: MessageCircle,
  },
  unauthenticated: {
    href: '/login',
    label: 'Go to Login',
    icon: HomeIcon,
  },
} as const;

// ==========================================
// Not Found Page Component
// ==========================================

/**
 * Custom 404 Not Found page component.
 *
 * Features:
 * - Server-side auth check for contextual navigation
 * - Responsive design with proper spacing
 * - Accessible markup with proper headings
 * - Clear call-to-action buttons
 *
 * @returns The 404 page JSX
 */
export default async function NotFound() {
  const { isAuth } = await checkServerAuth();

  // Select route based on auth state
  const primaryRoute = isAuth ? ROUTES.authenticated : ROUTES.unauthenticated;
  const PrimaryIcon = primaryRoute.icon;

  return (
    <main
      className="grid min-h-dvh place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="text-center">
        {/* Error Code */}
        <p
          className="text-6xl font-bold text-primary"
          aria-label="Error code"
        >
          404
        </p>

        {/* Error Title */}
        <h1
          id="error-title"
          className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          Page not found
        </h1>

        {/* Error Description */}
        <p className="mt-6 text-pretty text-base leading-7 text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          <br />
          The page may have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {/* Primary Action */}
          <Button
            asChild
            size="lg"
          >
            <Link
              href={primaryRoute.href}
              className="gap-2"
            >
              <PrimaryIcon
                className="size-4"
                aria-hidden="true"
              />
              {primaryRoute.label}
            </Link>
          </Button>

          {/* Secondary Action - Support */}
          <Button
            variant="outline"
            size="lg"
            asChild
          >
            <Link
              href="/support"
              className="gap-2"
            >
              <HelpCircle
                className="size-4"
                aria-hidden="true"
              />
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
