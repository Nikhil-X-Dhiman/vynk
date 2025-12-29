import { env } from 'node:process';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(env.CLIENT_SOCKET_URL, {
      withCredentials: true,
      // autoConnect: false,
      transports: ['websocket'],
      ackTimeout: 10000,
      retries: 3,
    });
  }
  return socket;
};
