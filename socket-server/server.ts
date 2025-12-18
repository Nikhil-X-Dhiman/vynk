import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer);

let userSocketList: string[] = [];
const PORT = 4000;

io.use((socket, next) => {
  // if (isValid(socket.request)) {
  //   next();
  // } else {
  //   next(new Error('invalid'));
  // }
});

io.on('connection', (socket) => {
  console.log(`New User Added: ${socket.id}`);
  console.log(`User Rooms: ${socket.rooms}`);
  socket.data.username = 'ND';
  userSocketList.push(socket.id);

  socket.emit('connected', 'Hello from Server!!!');
  socket.emit('hello', (msg: string) => {
    console.log(`Hello, ${msg}`);
  });

  socket.on('disconnecting', (reason) => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('user has left', socket.id);
      }
    }
  });
  socket.on('disconnect', () => {
    console.log(`User with Socket ID: ${socket.id} is disconnected`);
    userSocketList = userSocketList.filter((item) => item !== socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`SOCKET IO Server is starting at PORT ${PORT}`);
});
