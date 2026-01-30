'use client';

import { checkClientAuth } from '@/lib/auth/check-client-auth';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { isAuth, session } = await checkClientAuth();
        if (isAuth && session?.data?.user && session.data.session) {
          setUser(session?.data?.user);
          setSession(session?.data?.session);
        }
      } catch (error) {
        console.error('Failed to fetch Session: ', error);
      }
    };
    fetchSession();
  }, [setSession, setUser]);

  return <>{children}</>;
};
