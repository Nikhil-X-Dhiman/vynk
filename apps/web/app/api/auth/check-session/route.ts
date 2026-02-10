import { auth } from '@/lib/auth/auth-server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ isAuth: false }, { status: 401 });
    }

    return NextResponse.json({ isAuth: true });
  } catch (error) {
    console.error('[Auth API] Failed to check session:', error);
    return NextResponse.json({ isAuth: false }, { status: 500 });
  }
}
