'use client';

import { useAuthStore } from '@/store/auth';
import { getCurrentSession } from '@/lib/auth/get-session';
import { useEffect } from 'react';

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = getCurrentSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (data?.session && data?.user) {
      setUser(data.user);
      setSession(data.session);
    }
  }, [data, setUser, setSession]);

  return <>{children}</>;
}
