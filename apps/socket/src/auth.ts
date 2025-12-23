// apps/socket/auth.ts
import { verifyAccessToken } from '@repo/shared/auth';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));

  const user = verifyAccessToken(token);
  socket.data.user = user;
  next();
});
