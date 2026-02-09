import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkServerAuth } from './lib/auth/check-server-auth';

// Route constants for maintainability
const ROUTES = {
  HOME: '/',
  CHATS: '/chats',
  LOGIN: '/login',
} as const;

const PROTECTED_ROUTES = ['/', '/chats', '/settings', '/stories', '/calls'];

/**
 * Proxy middleware for authentication and route protection.
 * Handles authentication checks and redirects for protected routes.
 */
export const proxy = async (request: NextRequest) => {
  try {
    const { isAuth } = await checkServerAuth();

    if (isAuth) {
      // Redirect authenticated users from home to chats
      if (request.nextUrl.pathname === ROUTES.HOME) {
        return NextResponse.redirect(new URL(ROUTES.CHATS, request.url));
      }
      return NextResponse.next();
    }

    // Unauthenticated: redirect to login
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  } catch (error) {
    // Log the error for debugging and monitoring
    console.error('[Proxy Auth Error]:', error);

    // Fail secure - redirect to login on auth errors
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }
};

export const config = {
  matcher: PROTECTED_ROUTES,
};
