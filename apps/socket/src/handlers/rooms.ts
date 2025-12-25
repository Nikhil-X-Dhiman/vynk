import { Socket, Server } from 'socket.io';

export async function joinRoomHandler(
  io: Server,
  socket: Socket,
  { conversationId: string }
) {
  socket.join(conversationId);
}
