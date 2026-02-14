'use client';

/**
 * @fileoverview Session Provider Component
 *
 * Provides client-side session state management.
 * - Synchronous hydration from server-rendered session
 * - Automatic data sync on first authenticated mount
 * - Cross-tab session re-validation
 *
 * @module components/providers/SessionProvider
 */

import { useEffect, useRef } from 'react';
import type { Session, User } from 'better-auth';
import { useAuthStore } from '@/store/auth';
import { authClient } from '@/lib/auth/auth-client';
import { SyncService } from '@/lib/services/sync';

// ==========================================
// Constants
// ==========================================

const REVALIDATION_INTERVAL_MS = 60_000
const LOG = '[Session]';

// ==========================================
// Types
// ==========================================

export interface InitialSession {
  user: User;
  session: Session;
}

interface SessionProviderProps {
  children: React.ReactNode
  initialSession: InitialSession | null
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hydrates auth store from server session.
 * Runs once per mount.
 */
function useHydrateAuth(initialSession: InitialSession | null): void {
  const hydrated = useRef(false);

  if (!hydrated.current) {
    const store = useAuthStore.getState()
    if (initialSession?.user && initialSession?.session) {
      store.setAuth(initialSession.user, initialSession.session);
    } else {
      store.reset()
    }
    hydrated.current = true;
  }
}

/**
 * Triggers data sync when authenticated.
 */
function useInitialSync(isAuthenticated: boolean): void {
  const triggered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || triggered.current) return;
    triggered.current = true;

    SyncService.triggerSync().catch((error) => {
      console.error(`${LOG} Initial sync failed:`, error);
    });
  }, [isAuthenticated]);
}

/**
 * Syncs session state across tabs.
 */
function useCrossTabSync(): void {
  const lastCheckRef = useRef(0);

  useEffect(() => {
    async function revalidate() {
      if (document.visibilityState !== 'visible') return

      const now = Date.now()
      if (now - lastCheckRef.current < REVALIDATION_INTERVAL_MS) return
      lastCheckRef.current = now

      try {
        const { data } = await authClient.getSession()
        const store = useAuthStore.getState()

        if (!data) {
          console.log(`${LOG} Session expired/logged out`)
          store.reset()
          await SyncService.clearLocalData()
        } else {
          store.setAuth(data.user, data.session)
        }
      } catch (error) {
        console.error(`${LOG} Revalidation failed:`, error)
      }
    }

    document.addEventListener('visibilitychange', revalidate)
    return () => document.removeEventListener('visibilitychange', revalidate)
  }, []);
}

// ==========================================
// Component
// ==========================================

export default function SessionProvider({
  children,
  initialSession,
}: SessionProviderProps): React.JSX.Element {
  // Validate session on mount
  useEffect(() => {
    async function validate() {
      try {
        const { data } = await authClient.getSession()
        if (!data) {
          console.log(`${LOG} Session invalid on mount`)
          useAuthStore.getState().reset()
          await SyncService.clearLocalData()
        }
      } catch (err) {
        console.error(`${LOG} Validation failed:`, err)
      }
    }
    validate()
  }, [])

  useHydrateAuth(initialSession)
  useInitialSync(!!initialSession)
  useCrossTabSync()

  return <>{children}</>
}
