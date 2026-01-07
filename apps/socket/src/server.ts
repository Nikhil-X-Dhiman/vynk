import { createServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@repo/shared';
import { joinRoomHandler } from './contracts/rooms';
import { sendMessageHandler } from './contracts/message';
import { getSession } from './auth/get-session';
import { authMiddleware } from './auth/middleware';
import { registerPresenceEvents } from '../events/presence-events';
import { registerMessageEvents } from '../events/message-events';
import { registerReadEvents } from '../events/read-events';
import { registerTypingEvents } from '../events/typing-events';
import { joinSelf } from './rooms';

const PORT = 3001;
const httpServer = createServer();
let users = 0;

const io = new Server(httpServer, {
  connectionStateRecovery: {},
  cors: { origin: process.env.NEXT_URL, credentials: true },
  pingTimeout: 30000,
});

// TODO: Middleware for AUTH Checking
io.use(authMiddleware);

io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  joinSelf(socket);
  registerPresenceEvents(socket);
  registerMessageEvents(socket);
  registerReadEvents(socket);
  registerTypingEvents(socket);
});
// io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
//   // TODO: Event Listener Constants for error prone approach
//   users++;
//   console.log(`connected: ${socket.id}`);
//   // registerMessageHandlers(socket);
//   // registerPresenceHandlers(socket);
//   socket.broadcast.emit('user:connected', users);

//   socket.emit('welcome:user', 'Welcome to Vynk...');
//   socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
//     joinRoomHandler(io, socket, data);
//   });

//   socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
//     sendMessageHandler(io, socket, data);
//   });

//   socket.on(SOCKET_EVENTS.DISCONNECT, () => {
//     socket.broadcast.emit('user:connected', users);
//     console.log(`disconnected: ${socket.id}`);
//   });
// });

httpServer.listen(PORT, () => {
  console.log(`Socket server running on ${PORT}`);
});

export { io };
