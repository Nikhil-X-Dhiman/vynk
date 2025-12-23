import { createServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../packages/shared/constants';

const PORT = 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', credentials: true },
});

// TODO: Middleware for AUTH Checking

io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
  // TODO: Event Listener Constants for error prone approach
  console.log(`connected: ${socket.id}`);
  registerMessageHandlers(socket);
  registerPresenceHandlers(socket);
  socket.on(SOCKET_EVENTS.GREETING, (msg) => {
    console.log(msg);
  });
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on ${PORT}`);
});
