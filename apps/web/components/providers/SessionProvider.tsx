'use client';

/**
 * @fileoverview Session Provider Component
 *
 * Provides client-side session state management with:
 * - Synchronous hydration from server-rendered session
 * - Automatic initial / delta sync on first authenticated mount
 * - Cross-tab session re-validation on visibility change
 * - Logout propagation across tabs
 *
 * **Important:** Socket listeners and data sync triggers are handled
 * separately in `ServiceWorkerRegister`. This provider is concerned
 * only with *auth state* — keeping the Zustand store truthful.
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

/** Minimum interval between session re-validation checks (ms) */
const REVALIDATION_INTERVAL_MS = 60_000; // 1 minute

/** Log prefix */
const LOG = '[Session]';

// ==========================================
// Types
// ==========================================

/**
 * Server-side session payload passed from the root layout.
 */
export interface InitialSession {
  user: User;
  session: Session;
}

/**
 * Props for the {@link SessionProvider} component.
 */
interface SessionProviderProps {
  /** Child components that will have access to auth state */
  children: React.ReactNode;
  /** Session fetched on the server; `null` when unauthenticated */
  initialSession: InitialSession | null;
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hydrates the auth store synchronously during render to prevent
 * a flash of unauthenticated content on initial page load.
 *
 * Runs exactly once via a ref guard — subsequent re-renders are no-ops.
 */
function useHydrateAuth(initialSession: InitialSession | null): void {
  const hydrated = useRef(false);

  if (!hydrated.current) {
    const store = useAuthStore.getState();

    if (initialSession?.user && initialSession?.session) {
      store.setAuth(initialSession.user, initialSession.session);
    } else {
      store.reset();
    }

    hydrated.current = true;
  }
}

/**
 * Triggers the appropriate sync (initial or delta) once after the
 * first authenticated mount.
 *
 * - First-time users → full initial sync
 * - Returning users → incremental delta sync
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
 * Re-validates the session against the server when the tab becomes
 * visible. Propagates logout across tabs and keeps the auth store
 * in sync with the server's source of truth.
 *
 * Throttled to at most once per {@link REVALIDATION_INTERVAL_MS}.
 */
function useCrossTabSync(): void {
  const lastCheckRef = useRef(0);

  useEffect(() => {
    async function revalidateSession(): Promise<void> {
      // Only run when the tab is actually visible
      if (document.visibilityState !== 'visible') return;

      // Throttle — skip if we checked recently
      const now = Date.now();
      if (now - lastCheckRef.current < REVALIDATION_INTERVAL_MS) return;
      lastCheckRef.current = now;

      try {
        const { data } = await authClient.getSession();
        const store = useAuthStore.getState();

        if (!data) {
          // Another tab logged out — clear this tab's state
          console.log(`${LOG} Session expired or logged out in another tab`);
          store.reset();
          await SyncService.clearLocalData();
        } else {
          // Keep store perfectly aligned with server reality
          store.setAuth(data.user, data.session);
        }
      } catch (error) {
        console.error(`${LOG} Session re-validation failed:`, error);
      }
    }

    // `visibilitychange` covers both tab-switch and window-focus
    // scenarios, so a separate `focus` listener is unnecessary.
    document.addEventListener('visibilitychange', revalidateSession);

    return () => {
      document.removeEventListener('visibilitychange', revalidateSession);
    };
  }, []);
}

// ==========================================
// Component
// ==========================================

/**
 * Manages client-side authentication state for the entire app.
 *
 * Mounted once in the root layout, wrapping all page content.
 * Renders only its children — no additional DOM nodes.
 *
 * Responsibilities:
 * 1. **Hydration** — syncs server-side session into the Zustand store
 *    before the first paint to prevent flicker.
 * 2. **Initial sync** — triggers a full or delta data sync on first
 *    authenticated mount.
 * 3. **Cross-tab sync** — re-validates the session when the user
 *    returns to the tab, handling logout propagation and stale tokens.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * const { session } = await checkServerAuth();
 *
 * <SessionProvider initialSession={session}>
 *   {children}
 * </SessionProvider>
 * ```
 */
export default function SessionProvider({
  children,
  initialSession,
}: SessionProviderProps): React.JSX.Element {
  // Re-validate session on mount to catch DB changes (e.g. session deleted)
  // that might be hidden by a cached page shell from the Service Worker.
  useEffect(() => {
    async function validateOnMount() {
      try {
        const { data } = await authClient.getSession()
        if (!data) {
          console.log(`${LOG} Session invalid on mount, resetting...`)
          useAuthStore.getState().reset()
          await SyncService.clearLocalData()
        }
      } catch (err) {
        console.error(`${LOG} Initial re-validation failed:`, err)
      }
    }
    validateOnMount()
  }, [])

  useHydrateAuth(initialSession)
  useInitialSync(initialSession !== null)
  useCrossTabSync()

  return <>{children}</>
}
