import { getSocket } from './client';

import { SOCKET_EVENTS } from '@repo/shared';
export function onMessageReceived(
  callback: (msg: { id: string; text: string }) => void
) {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, callback);
}
