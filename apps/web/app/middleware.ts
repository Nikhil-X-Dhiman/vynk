import { auth } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';

const session = await auth.api.getSession();

console.log('Root Middleware');
if (!session) {
  redirect('/login');
}
