/**
 * @fileoverview Login Branding Section
 * @module components/auth/LoginBranding
 */

import { VynkLogo } from '@/components/ui/VynkLogo';

export function LoginBranding() {
  return (
    <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Logo Wrapper */}
      <div className="relative flex size-32 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-white/30 blur-xl dark:bg-white/5" />
        <VynkLogo className="relative z-10 size-full scale-125 drop-shadow-2xl" />
      </div>

      {/* Copy */}
      <div className="space-y-1 text-center">
        <h1 className="bg-linear-to-br from-gray-900 to-gray-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-gray-400">
          Welcome back
        </h1>
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Fast, secure, and beautiful messaging on{' '}
          <span className="inline-block bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text font-bold text-transparent dark:from-indigo-400 dark:to-purple-400">
            Vynk
          </span>
          .
        </p>
      </div>
    </div>
  )
}
