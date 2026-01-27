import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Define protected routes
  const protectedPaths = ['/', '/chat', '/settings'];
  const isProtected = protectedPaths.some(path =>
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  if (isProtected) {
    // We cannot use 'better-auth' server SDK here directly if it uses DB (Edge incompatibility).
    // We fetch the session from the API route which runs in Node.js.
    // Assuming the Better Auth API is mounted at /api/auth

    const baseURL = request.nextUrl.origin;

    try {
        const res = await fetch(`${baseURL}/api/auth/get-session`, {
            headers: {
                cookie: request.headers.get('cookie') || '',
            },
        });

        const session = await res.json();

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } catch (err) {
        console.error("Middleware Auth Check Failed", err);
        // Fallback or safe fail? Secure default is to redirect.
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - public files (images etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
