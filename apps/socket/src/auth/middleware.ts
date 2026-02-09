/**
 * Authentication Middleware
 *
 * Validates socket connections using session cookies.
 * Attaches user data to socket for use in event handlers.
 */

import { Socket } from 'socket.io';
import { getSession } from './get-session';
import { logger } from '../utils';

/**
 * Authentication errors that can occur during socket connection
 */
const AUTH_ERRORS = {
  NO_COOKIES: 'Authentication failed: No cookies found',
  INVALID_SESSION: 'Authentication failed: Invalid session',
  SESSION_EXPIRED: 'Authentication failed: Session expired',
  INTERNAL_ERROR: 'Authentication failed: Internal error',
} as const;

/**
 * Middleware to authenticate socket connections.
 * Validates the session cookie and attaches user data to the socket.
 */
export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const cookie = socket.handshake.headers.cookie;

    if (!cookie) {
      logger.warn('Auth failed: No cookies', { socketId: socket.id });
      return next(new Error(AUTH_ERRORS.NO_COOKIES));
    }
    // Better-Auth checking user session
    const session = await getSession(cookie);

    // Validate session structure
    if (!session?.session || !session?.user) {
      logger.warn('Auth failed: Invalid session structure', {
        socketId: socket.id,
      });
      return next(new Error(AUTH_ERRORS.INVALID_SESSION));
    }

    // Check session expiration
    const expiresAt = new Date(session.session.expiresAt);
    if (expiresAt < new Date()) {
      logger.warn('Auth failed: Session expired', {
        socketId: socket.id,
        userId: session.user.id,
        expiredAt: expiresAt.toISOString(),
      });
      return next(new Error(AUTH_ERRORS.SESSION_EXPIRED));
    }

    // Attach user data to socket
    socket.data.user = session.user;
    socket.data.sessionId = session.session.id;

    logger.debug('Socket authenticated', {
      socketId: socket.id,
      userId: session.user.id,
    });

    next();
  } catch (err) {
    logger.error('Socket auth error', {
      socketId: socket.id,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    next(new Error(AUTH_ERRORS.INTERNAL_ERROR));
  }
}
