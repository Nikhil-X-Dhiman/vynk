import { idbStorage } from '@/lib/utils/indexeddb-store';
import { Session, User } from 'better-auth';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authStoreTypes } from './types';

const useAuthStore = create(
  persist<authStoreTypes>(
    (set) => ({
      // states
      session: null,
      user: null,
      isAuthenticated: false,

      // actions
      setSession: (session: Session | null) => {
        set({ session, isAuthenticated: !!session });
      },
      setUser: (user: User | null) => {
        set({ user });
      },
      setAuth: (user: User | null, session: Session | null) => {
        set({ user, session, isAuthenticated: !!(user && session) });
      },
      reset: () => {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage', // unique name for the IndexedDB key
      storage: createJSONStorage(() => idbStorage), // Use the custom IDB storage
    },
  ),
);

export { useAuthStore }; // Use the custom IDB storage
