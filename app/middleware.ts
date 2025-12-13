import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

const session = await auth.api.getSession();

console.log('Root Middleware');
if (!session) {
  redirect('/login');
}
