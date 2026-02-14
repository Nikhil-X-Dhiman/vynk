/**
 * @fileoverview Next.js Proxy — Route Protection
 *
 * Lightweight cookie-based auth gate that runs on the Edge Runtime.
 * Checks for the presence of the Better Auth session cookie to decide
 * whether to allow access or redirect to `/login`.
 *
 * **Important:** This intentionally does NOT import the full `auth`
 * object (which depends on Node.js, DB pools, and Redis). We only
 * need to check cookie *existence* here — the actual session
 * validation happens server-side inside `checkServerAuth()`.
 *
 * @module proxy
 *
 * @see {@link https://nextjs.org/docs/app/getting-started/proxy}
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ==========================================
// Constants
// ==========================================

/**
 * Better Auth session cookie name.
 * Format: `__Secure-{prefix}.session_token` when `useSecureCookies` is true.
 * Falls back to `{prefix}.session_token` in development (non-HTTPS).
 */
const SESSION_COOKIE_SECURE = '__Secure-vynk.session_token'
const SESSION_COOKIE_DEV = 'vynk.session_token'

const ROUTES = {
  CHATS: '/chats',
  LOGIN: '/login',
} as const

// ==========================================
// Proxy
// ==========================================

/**
 * Checks for a session cookie and redirects unauthenticated users to `/login`.
 * Authenticated users hitting `/` are redirected to `/chats`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session cookie (secure in prod, plain in dev)
  const hasSession =
    request.cookies.has(SESSION_COOKIE_SECURE) ||
    request.cookies.has(SESSION_COOKIE_DEV)

  // Authenticated (shallow check passed)
  if (hasSession) {
    // If hitting the root, redirect to chats first (optimistic)
    if (pathname === '/') {
      return NextResponse.redirect(new URL(ROUTES.CHATS, request.url))
    }

    // Allow access - Server Components will verify the session deeply
    return NextResponse.next()
  }

  // Unauthenticated: redirect to login
  return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
}

// ==========================================
// Matcher
// ==========================================

/**
 * Only run proxy on protected routes.
 * Explicitly excludes: /login, /api/auth/*, static files, and _next internals.
 */
export const config = {
  matcher: [
    '/',
    '/chats/:path*',
    '/settings/:path*',
    '/stories/:path*',
    '/calls/:path*',
  ],
}
