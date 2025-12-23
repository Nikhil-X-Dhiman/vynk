export function registerMessageHandlers(socket) {
  socket.on('send-message', async (payload) => {
    // validate
    // store in DB
    // emit to room
  });
}
