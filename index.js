const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let users = {};
let rooms = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('login', (data) => {
    let nickname = data.nickname;
    let roomid = data.roomid;
    if (!rooms[roomid]) {
      rooms[roomid] = [];
    }
    users[socket.id] = { nickname, roomid };
    rooms[roomid].push(socket.id);
    socket.join(roomid);
    io.to(roomid).emit('userJoined', nickname);
  });

  socket.on('disconnect', () => {
    let user = users[socket.id];
    if (user) {
      let roomid = user.roomid;
      let index = rooms[roomid].indexOf(socket.id);
      if (index!== -1) {
        rooms[roomid].splice(index, 1);
      }
      delete users[socket.id];
      io.to(roomid).emit('userLeft', user.nickname);
    }
  });

  socket.on('sendMessage', (data) => {
    let user = users[socket.id];
    let message = data.message;
    let roomid = user.roomid;
    io.to(roomid).emit('newMessage', { nickname: user.nickname, message });
  });

  socket.on('command', (data) => {
  let user = users[socket.id];
  let command = data.command;
  let args = data.args;
  switch (command) {
    case 'name':
      user.nickname = args[0];
      io.to(user.roomid).emit('userUpdated', user.nickname);
      break;
    case 'color':
      user.color = args[0];
      io.to(user.roomid).emit('userUpdated', user.nickname);
      break;
    case 'image':
      io.to(user.roomid).emit('newImage', { nickname: user.nickname, url: args[0] });
      break;
    case 'video':
      io.to(user.roomid).emit('newVideo', { nickname: user.nickname, url: args[0] });
      break;
    case 'YouTube':
      io.to(user.roomid).emit('newYouTube', { nickname: user.nickname, url: args[0] });
      break;
  }
});
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
