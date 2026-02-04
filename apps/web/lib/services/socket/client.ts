import { io, Socket } from 'socket.io-client';

/**
 * Singleton socket instance for real-time communication.
 * Connects to the /chat namespace on the WebSocket server.
 */
let socket: Socket | null = null;

/**
 * Get or create the Socket.IO client instance.
 * Uses NEXT_PUBLIC_SOCKET_URL for browser access (Next.js only exposes NEXT_PUBLIC_* vars).
 *
 * Features:
 * - Credentials enabled for auth cookie transmission
 * - WebSocket-only transport (no polling fallback)
 * - Auto-retry with 10s timeout and 3 retries
 *
 * @returns Socket instance (creates one if not exists)
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/chat',
      {
        withCredentials: true,
        transports: ['websocket'],
        ackTimeout: 10000,
        retries: 3,
      },
    );
  }
  return socket;
};
