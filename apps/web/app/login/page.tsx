/**
 * @fileoverview Login Page
 *
 * Server component that gates access: authenticated users are redirected
 * to `/chats`, while unauthenticated users see the phone-number login flow.
 *
 * @module app/login/page
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { checkServerAuth } from '@/lib/auth/check-server-auth';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LoginBackground } from '@/components/auth/LoginBackground'
import AuthFlow from '@/components/auth/AuthFlow';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to Vynk — fast, secure, and beautiful real-time messaging.',
};

export default async function LoginPage() {
  const { isAuth } = await checkServerAuth();

  if (isAuth) {
    redirect('/chats');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <LoginBackground />

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-20">
        <ModeToggle />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center space-y-8 px-4">
        <section
          id="login-form"
          className="w-full overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-1 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/40"
        >
          <AuthFlow />
        </section>
      </div>
    </main>
  )
}
