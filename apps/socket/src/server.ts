/**
 * Socket Server Entry Point
 *
 * Production-ready WebSocket server with:
 * - Redis adapter for horizontal scaling
 * - Graceful shutdown handling
 * - Structured logging
 * - Namespace-based event routing
 */

import { createServer, Server as HttpServer } from 'http';
import { Server, Namespace } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';

import { config } from './config';
import { logger } from './utils';
import { authMiddleware } from './auth/middleware';
import { RoomService } from './services/room-service';

// Event handlers
import { registerMessageEvents } from './events/message-events';
import { registerPresenceEvents } from './events/presence-events';
import { registerReadEvents } from './events/read-events';
import { registerTypingEvents } from './events/typing-events';
import { registerStoryEvents } from './events/story-events';
import { registerCallEvents } from './events/call-events';
import { registerUserEvents } from './events/user-events';
import { registerFriendshipEvents } from './events/friendship-events';
import { registerConversationEvents } from './events/conversation-events';

import { SOCKET_EVENTS } from '@repo/shared';

// =============================================================================
// Server Instances
// =============================================================================

let httpServer: HttpServer;
let io: Server;
let chatNamespace: Namespace;
let pubClient: RedisClientType;
let subClient: RedisClientType;

// =============================================================================
// Initialization
// =============================================================================

async function initializeRedis(): Promise<void> {
  pubClient = createClient({ url: config.redis.url }) as RedisClientType;
  subClient = pubClient.duplicate() as RedisClientType;

  pubClient.on('error', (err) =>
    logger.error('Redis Pub Client Error', { error: err.message }),
  );
  subClient.on('error', (err) =>
    logger.error('Redis Sub Client Error', { error: err.message }),
  );

  await Promise.all([pubClient.connect(), subClient.connect()]);
  logger.info('Redis adapter connected', { url: config.redis.host });
}

function initializeSocketServer(): void {
  httpServer = createServer();

  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Attach Redis adapter
  io.adapter(createAdapter(pubClient, subClient));
}

function initializeChatNamespace(): void {
  chatNamespace = io.of('/chat');

  // Authentication middleware
  chatNamespace.use(authMiddleware);

  // Connection handler
  chatNamespace.on('connection', async (socket) => {
    const userId = socket.data.user.id;
    logger.info('User connected', { userId, socketId: socket.id });

    try {
      // Auto-join user to their rooms like groups and personal room
      await RoomService.joinUserRooms(socket, userId);

      // Register all event handlers
      registerPresenceEvents(socket);
      registerMessageEvents(socket);
      registerReadEvents(socket);
      registerTypingEvents(socket);
      registerStoryEvents(socket);
      registerCallEvents(socket);
      registerUserEvents(socket);
      registerFriendshipEvents(socket);
      registerConversationEvents(socket);

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        logger.info('User disconnected', {
          userId,
          socketId: socket.id,
          reason,
        });
      });
    } catch (error) {
      logger.error('Error during connection setup', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.disconnect(true);
    }
  });
}
// Just a Placeholder for now
// TODO: We will use Redis PubSub to broadcast events to all instances using Better-Auth config in hook property
function initializeRedisPubSub(): void {
  // Listen for new user registrations (from auth service)
  subClient.subscribe('user:registered', (message) => {
    try {
      const user = JSON.parse(message);
      chatNamespace.emit(SOCKET_EVENTS.USER_NEW, user);
      logger.debug('Broadcasted new user', { userId: user.id });
    } catch (err) {
      logger.error('Failed to process user:registered message', {
        error: err instanceof Error ? err.message : 'Parse error',
      });
    }
  });
}

// =============================================================================
// Startup & Shutdown
// =============================================================================

async function startServer(): Promise<void> {
  try {
    logger.info('Starting socket server...');

    await initializeRedis();
    initializeSocketServer();
    initializeChatNamespace();
    initializeRedisPubSub();

    httpServer.listen(config.port, () => {
      logger.info(`Socket server running`, {
        port: config.port,
        environment: config.isProd ? 'production' : 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer?.close(() => {
    logger.info('HTTP server closed');
  });

  // Disconnect all sockets
  if (io) {
    io.disconnectSockets(true);
    logger.info('All sockets disconnected');
  }

  // Close Redis connections
  try {
    await Promise.all([pubClient?.quit(), subClient?.quit()]);
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

// Start the server
startServer();

// =============================================================================
// Exports (for use in event handlers)
// =============================================================================

export { io, chatNamespace };
