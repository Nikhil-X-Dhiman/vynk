import { Socket } from 'socket.io';
import { getSession } from './get-session';

async function authMiddleware(socket: Socket, next: (err?: Error) => void) {
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
}

export { authMiddleware };
