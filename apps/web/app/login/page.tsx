import AuthFlow from '@/components/auth/AuthFlow';
import { redirect } from 'next/navigation';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { VynkLogo } from '@/components/ui/VynkLogo';
import { checkServerAuth } from '@/lib/auth/check-server-auth';

/**
 * Background decorative elements including Mica effect and Mesh gradients
 */
function BackgroundDecorations() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Mesh Gradients - Balanced middle ground between vivid and subtle */}
      {/* 1. Top Left - Purple/Indigo */}
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/25 blur-[110px] animate-pulse will-change-opacity dark:bg-purple-600/15" />

      {/* 2. Bottom Right - Blue/Cyan */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-blue-500/25 blur-[110px] animate-pulse delay-1000 will-change-opacity dark:bg-blue-600/15" />

      {/* 3. Center Left/Middle - Deep Indigo */}
      <div className="absolute top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/15 blur-[110px] animate-pulse delay-500 will-change-opacity dark:bg-indigo-600/10" />

      {/* Mica/Acrylic Overlay - Balanced density for professional depth */}
      <div className="absolute inset-0 size-full bg-linear-to-b from-indigo-50/30 via-transparent to-white/85 dark:from-slate-950/30 dark:via-transparent dark:to-black/85 backdrop-blur-xl" />
    </div>
  );
}

/**
 * Brand identity section with logo and welcoming text
 */
function Branding() {
  return (
    <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Logo container with glass effect */}
      <div className="relative size-32 flex items-center justify-center">
        <div className="absolute inset-0 bg-white/30 dark:bg-white/5 rounded-3xl blur-xl" />
        <VynkLogo className="size-full drop-shadow-2xl relative z-10 scale-125" />
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          Fast, secure, and beautiful messaging on{' '}
          <span className="font-bold inline-block text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Vynk
          </span>
          .
        </p>
      </div>
    </div>
  );
}

async function LoginPage() {
  const { isAuth } = await checkServerAuth();

  if (isAuth) {
    redirect('/chats');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative border-none overflow-hidden bg-background">
      <BackgroundDecorations />

      {/* Top bar tools */}
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center space-y-8 relative px-4">
        <Branding />

        {/* Auth Flow Container with Glassmorphism */}
        <section className="w-full backdrop-blur-md bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-1 overflow-hidden">
          <AuthFlow />
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
