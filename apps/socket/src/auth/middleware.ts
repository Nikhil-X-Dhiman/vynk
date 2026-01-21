import { Socket } from 'socket.io';
import { getSession } from './get-session';

async function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) {
      return next(new Error('Authentication failed: No cookies found'));
    }

    const session = await getSession(cookie);

    // Strict check: session AND session.session must exist (Better-auth structure)
    if (!session || !session.session || !session.user) {
      return next(new Error('Authentication failed: Invalid session'));
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
