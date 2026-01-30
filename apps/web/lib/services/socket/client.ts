import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.CLIENT_SOCKET_URL || 'http://localhost:3001/chat', {
      withCredentials: true,
      // autoConnect: false,
      transports: ['websocket'],
      ackTimeout: 10000,
      retries: 3,
    });
  }
  return socket;
};
