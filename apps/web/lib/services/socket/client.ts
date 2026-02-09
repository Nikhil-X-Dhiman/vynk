/**
 * @fileoverview Socket.IO Client Configuration
 *
 * Creates and exports a singleton Socket.IO client instance for real-time
 * communication with the WebSocket server. Connects to the /chat namespace.
 *
 * @module lib/services/socket/client
 *
 * @example
 * ```ts
 * import { getSocket, disconnectSocket } from '@/lib/services/socket';
 *
 * // Get the socket instance
 * const socket = getSocket();
 *
 * // Listen for events
 * socket.on('message:new', (msg) => console.log(msg));
 *
 * // Disconnect when done
 * disconnectSocket();
 * ```
 */

import { io, Socket } from 'socket.io-client';

// ==========================================
// Configuration
// ==========================================

/**
 * WebSocket server URL.
 * Uses NEXT_PUBLIC_ prefix for client-side access in Next.js.
 */
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/chat';

/**
 * Socket.IO connection options.
 */
const SOCKET_OPTIONS = {
  /** Enable credentials for auth cookie transmission */
  withCredentials: true,
  /** Use WebSocket-only transport (no polling fallback for better performance) */
  transports: ['websocket'] as string[],
  /** Acknowledgment timeout in milliseconds */
  ackTimeout: 10000,
  /** Number of reconnection retries */
  retries: 3,
  /** Reconnection delay in milliseconds */
  reconnectionDelay: 1000,
  /** Maximum reconnection delay */
  reconnectionDelayMax: 5000,
};

// ==========================================
// Singleton Instance
// ==========================================

/**
 * Singleton socket instance.
 */
let socket: Socket | null = null;

// ==========================================
// Public API
// ==========================================

/**
 * Gets or creates the Socket.IO client instance.
 *
 * Features:
 * - Credentials enabled for auth cookie transmission
 * - WebSocket-only transport (no polling fallback)
 * - Auto-retry with exponential backoff
 *
 * @returns The Socket.IO client instance
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, SOCKET_OPTIONS);
  }
  return socket;
}

/**
 * Checks if socket is currently connected.
 *
 * @returns True if socket exists and is connected
 */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Disconnects the socket if connected.
 * Clears the singleton instance for clean reconnection.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Reconnects the socket (disconnect and reconnect).
 * Useful for forcing a fresh connection after auth changes.
 */
export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}

/**
 * Gets the current socket ID if connected.
 *
 * @returns Socket ID or undefined if not connected
 */
export function getSocketId(): string | undefined {
  return socket?.id;
}
