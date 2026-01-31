'use server';
import { auth } from '@repo/auth';
import { headers } from 'next/headers';

export const checkServerAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { isAuth: false, session: null };
  }
  return { isAuth: true, session };
};
