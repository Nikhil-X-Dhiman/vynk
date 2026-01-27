import { create } from 'zustand';

interface UserPresence {
  id: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface PresenceStore {
  onlineUsers: Record<string, UserPresence>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  setAllOnline: (userIds: string[]) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineUsers: {},
  setOnline: (userId) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: { id: userId, isOnline: true },
      },
    })),
  setOffline: (userId) =>
    set((state) => {
      const newUsers = { ...state.onlineUsers };
      delete newUsers[userId]; // Or keep and mark offline?
      // "Online List" usually implies only online users.
      return { onlineUsers: newUsers };
    }),
  setAllOnline: (userIds) =>
    set(() => {
        const map: Record<string, UserPresence> = {};
        userIds.forEach(id => {
            map[id] = { id, isOnline: true };
        });
        return { onlineUsers: map };
    }),
}));
