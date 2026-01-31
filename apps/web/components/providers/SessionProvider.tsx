'use client';

import { Session, User } from 'better-auth';
import { useAuthStore } from '@/store/auth';
import { useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth/auth-client';

export default function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: { user: User; session: Session } | null;
}) {
  const init = useRef(false);

  if (!init.current) {
    if (initialSession?.user && initialSession?.session) {
      useAuthStore
        .getState()
        .setAuth(initialSession?.user, initialSession?.session);
    } else {
      useAuthStore.getState().reset();
    }
    init.current = true;
  }

  // 2. Cross-Tab Synchronization & Re-validation
  useEffect(() => {
    // THROTTLE CHECK for SESSION
    let lastCheckTime = 0;
    const CHECK_INTERVAL = 60 * 1000; // 1 minute
    const syncSession = async () => {
      const now = Date.now();

      if (now - lastCheckTime < CHECK_INTERVAL) return;
      lastCheckTime = now;
      // Only check when the user actually looks at the tab
      if (document.visibilityState === 'visible') {
        const { data } = await authClient.getSession();

        if (!data) {
          // If Tab A logged out, Tab B will now clear its store
          useAuthStore.getState().reset();
        } else {
          // Keep store perfectly in sync with server reality
          useAuthStore.getState().setAuth(data.user, data.session);
        }
      }
    };
    window.addEventListener('visibilitychange', syncSession);
    window.addEventListener('focus', syncSession); // Also check on focus
    return () => {
      window.removeEventListener('visibilitychange', syncSession);
      window.removeEventListener('focus', syncSession);
    };
  }, []);

  return <>{children}</>;
}
