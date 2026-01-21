import { Socket } from 'socket.io';
import { setUserOffline, setUserOnline } from '@repo/db';
import { io } from '../server';
import { SOCKET_EVENTS } from '@repo/shared';
// import { redis } from '../redis';

// function registerPresenceEvents(socket: Socket) {
//   const userId = socket.data.user.id;
//
//   // Mark new user online on redis
//   setUserOnline(userId).catch((err) =>
//     console.error('Error setting user online:', err)
//   );
//
//   // Announce new user presence to others
//   io.emit(SOCKET_EVENTS.USER_ONLINE, { userId });
//
//   socket.on('disconnect', async () => {
//     try {
//       await setUserOffline(userId);
//       io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
//     } catch (error) {
//       console.error('Error handling disconnect:', error);
//     }
//   });
// }
function registerPresenceEvents(socket: Socket) {
  const userId = socket.data.user.id;

  // Mark new user online on redis
  setUserOnline(userId).catch((err) =>
    console.error('Error setting user online:', err)
  );

  // Announce new user presence to others
  io.emit(SOCKET_EVENTS.USER_ONLINE, { userId });

  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    try {
      await setUserOffline(userId);
      // Optional: Emit offline event if needed
      io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
}
//TODO: what if i am in converssation & user goes online, how will it handle it: maybe a anew emit for announcing online presence

export { registerPresenceEvents };
