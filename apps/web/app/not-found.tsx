import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { checkServerAuth } from '@/lib/auth/check-server-auth';

export default async function NotFound() {
  const { isAuth } = await checkServerAuth();

  return (
    <main className="grid min-h-full place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="font-semibold text-4xl">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link href={isAuth ? '/chats' : '/login'}>
              {isAuth ? 'Go back to Chats' : 'Go to Login'}
            </Link>
          </Button>
          <Button
            variant="ghost"
            // asChild
            disabled={true}
          >
            <Link href="/support">
              Contact support <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
