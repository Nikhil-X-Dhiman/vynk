// Presence status shared across presence & sockets
export type PresenceStatus = 'online' | 'offline';

// Presence payload stored in Redis
export interface UserPresence {
  status: PresenceStatus;
  lastSeen: number;
}

// Typing domain
export interface TypingEvent {
  conversationId: string;
  userId: string;
}
