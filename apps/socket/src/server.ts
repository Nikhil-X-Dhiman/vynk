import { createServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@repo/shared';
import { joinRoomHandler } from './handlers/rooms';
import { sendMessageHandler } from './handlers/message';
import { getSession } from './auth/get-session';

const PORT = 3001;
const httpServer = createServer();
let users = 0;

const io = new Server(httpServer, {
  connectionStateRecovery: {},
  cors: { origin: 'http://localhost:3000', credentials: true },
});

// TODO: Middleware for AUTH Checking
io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) return next(new Error('No cookies'));

    const session = await getSession(cookie);
    if (!session) return next(new Error('Unauthorized'));

    socket.data.user = session.user;
    socket.data.sessionId = session.session.id;

    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  // TODO: Event Listener Constants for error prone approach
  users++;
  console.log(`connected: ${socket.id}`);
  // registerMessageHandlers(socket);
  // registerPresenceHandlers(socket);
  socket.broadcast.emit('user:connected', users);

  socket.emit('welcome:user', 'Welcome to Vynk...');
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
    joinRoomHandler(io, socket, data);
  });

  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
    sendMessageHandler(io, socket, data);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    socket.broadcast.emit('user:connected', users);
    console.log(`disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on ${PORT}`);
});
