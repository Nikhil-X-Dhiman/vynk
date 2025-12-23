export function registerPresenceHandlers(socket) {
  socket.on('user-online', () => {});
  socket.on('user-offline', () => {});
}
