import { signOutAction } from '../actions/auth-actions';
import AuthFlow from '@/components/auth/AuthFlow';
import { auth } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { VynkLogo } from '@/components/ui/VynkLogo';

async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect('/chats');
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-background">
       {/* Mica/Acrylic Background Effect */}
      <div className="absolute inset-0 z-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200 via-zinc-100 to-white dark:from-slate-900 dark:via-zinc-950 dark:to-black opacity-80 backdrop-blur-3xl" />

      {/* Mesh Gradients for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/30 blur-[120px] animate-pulse dark:bg-purple-900/20" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/30 blur-[120px] animate-pulse delay-1000 dark:bg-blue-900/20" />

       {/* Top bar with Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center space-y-8 relative">
        {/* Branding Section */}
         <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Logo container with glass effect */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                 <div className="absolute inset-0 bg-white/30 dark:bg-white/5 rounded-3xl blur-xl" />
                 <VynkLogo className="w-full h-full drop-shadow-2xl relative z-10 scale-125" />
            </div>

            <div className="text-center space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Welcome back
                </h1>
                <p className="text-muted-foreground text-sm font-medium tracking-wide">
                  Fast, secure, and beautiful messaging on Vynk.
                </p>
            </div>
         </div>

        {/* Auth Flow Container with Glassmorphism */}
        <div className="w-full backdrop-blur-md bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-1 overflow-hidden">
          <AuthFlow />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
