import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { authMiddleware } from './auth/middleware';
import { RoomService } from './services/room-service';
import { registerMessageEvents } from './events/message-events';
import { registerPresenceEvents } from './events/presence-events';
import { registerReadEvents } from './events/read-events';
import { registerTypingEvents } from './events/typing-events';
import { registerStoryEvents } from './events/story-events';
import { registerCallEvents } from './events/call-events';
import { registerUserEvents } from './events/user-events';
import { SOCKET_EVENTS } from '@repo/shared';

const PORT = 3001;
const httpServer = createServer();

// Redis setup for Adapter
const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;
const redisUrl = `redis://${REDIS_USERNAME || ''}:${REDIS_PASSWORD || ''}@${
  REDIS_HOST || 'localhost'
}:${REDIS_PORT || '6379'}`;

const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_URL, credentials: true },
  transports: ['websocket', 'polling'],
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Adapter connected');
});

// Chat Namespace
const chatNamespace = io.of('/chat');

// Middleware
chatNamespace.use(authMiddleware);

chatNamespace.on('connection', async (socket) => {
  const userId = socket.data.user.id;
  console.log(`User connected: ${userId}`);

  // Auto-join user rooms
  await RoomService.joinUserRooms(socket, userId);

  // Register Events
  // Register Events
  registerPresenceEvents(socket);
  registerMessageEvents(socket);
  registerReadEvents(socket);
  registerTypingEvents(socket);
  registerStoryEvents(socket);
  registerCallEvents(socket);
  registerUserEvents(socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// Redis Pub/Sub for New Users
subClient.subscribe('user:registered', (message) => {
  try {
    const user = JSON.parse(message);
    chatNamespace.emit(SOCKET_EVENTS.USER_NEW, user);
  } catch (err) {
    console.error('Failed to process user:registered message', err);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on ${PORT}`);
});

export { io, chatNamespace };
