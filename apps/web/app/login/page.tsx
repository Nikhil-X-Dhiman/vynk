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
import { headers } from 'next/headers';

async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Vynk</CardTitle>
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
