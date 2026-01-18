// 'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signOutAction } from '../actions/auth-actions';
import AuthFlow from '@/components/ui/AuthFlow';
import { auth } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ModeToggle } from '@/components/ui/ModeToggle';

async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect('/chats');
  }
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Vynk</CardTitle>
          <ModeToggle />
          <CardDescription></CardDescription>
          {session && (
            <form action={signOutAction}>
              <button type="submit">Logout</button>
            </form>
          )}
        </CardHeader>
        <CardContent>
          <AuthFlow />
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
