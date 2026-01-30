import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkServerAuth } from './lib/auth/check-server-auth';

export const proxy = async (request: NextRequest) => {
  const { isAuth } = await checkServerAuth();
  if (isAuth) {
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/chats', request.url));
    }
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/login', request.url));
  }
};

export const config = {
  matcher: ['/', '/chats', '/settings', '/stories', '/calls'],
};

// TODO: Implement Logging in the system
