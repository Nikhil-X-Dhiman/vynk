import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';

export async function sendMessageHandler(
  io: Server,
  socket: Socket,
  { conversationId, text }: { conversationId: string; text: string }
) {
  const message = {
    id: crypto.randomUUID(),
    text,
    senderId: socket.id,
  };

  io.to(conversationId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
}
