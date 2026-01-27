import { create } from 'zustand';
import { updateSettings } from '@/app/actions/settings';

interface SettingsState {
  theme: string;
  notifications: boolean;
  soundEnabled: boolean;
  setTheme: (theme: string) => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  setAll: (settings: { theme: string; notifications: boolean; soundEnabled: boolean }) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',
  notifications: true,
  soundEnabled: true,

  setTheme: async (theme) => {
      set({ theme });
      // We'll need the userId. Ideally store should handle it or UI calls action.
      // For optimistic UI, we set first.
  },

  toggleNotifications: () => {
      set((state) => ({ notifications: !state.notifications }));
  },

  toggleSound: () => {
      set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  setAll: (settings) => set(settings),
}));
