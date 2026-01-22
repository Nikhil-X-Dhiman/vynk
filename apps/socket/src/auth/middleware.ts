import { Socket } from 'socket.io';
import { getSession } from './get-session';

async function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) {
      return next(new Error('Authentication failed: No cookies found'));
    }

    const session = await getSession(cookie);

    // Strict check: session AND session.session must exist
    if (!session || !session.session || !session.user) {
      console.warn(`Auth failed for socket ${socket.id}: Valid cookie but invalid session.`);
      return next(new Error('Authentication failed: Invalid session'));
    }

    // Check if session is expired (if not handled by getSession)
    if (new Date(session.session.expiresAt) < new Date()) {
      return next(new Error('Authentication failed: Session expired'));
    }

    socket.data.user = session.user;
    socket.data.sessionId = session.session.id;

    next();
  } catch (err) {
    console.error('Socket Auth Error:', err);
    next(new Error('Authentication failed: Internal error'));
  }
}

export { authMiddleware };
