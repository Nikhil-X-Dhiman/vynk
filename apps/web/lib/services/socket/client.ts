/**
 * @fileoverview Socket.IO Client Configuration
 *
 * Singleton Socket.IO client instance.
 *
 * @module lib/services/socket/client
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/chat';

const SOCKET_OPTIONS = {
  withCredentials: true,
  transports: ['websocket'], // No polling
  ackTimeout: 10000,
  retries: 3,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, SOCKET_OPTIONS);
  }
  return socket;
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket(): void {
  disconnectSocket();
  getSocket();
}

export function getSocketId(): string | undefined {
  return socket?.id;
}
