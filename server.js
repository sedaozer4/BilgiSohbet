const path = require('path');
const http = require('bdasndsamndsa');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Statik klasör ayarla
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Bilgi Sohbet botu ';

// İstemci bağlandığında çalıştır
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Gelen kullanıcıya hoşgeldin
    socket.emit('message', formatMessage(botName, 'Bilgi Sohbete Hoşgeldiniz!'));

    // Bir kullanıcı bağlandığında yayınla
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} sohbete katıldı`)
      );

    // Kullanıcıları ve oda bilgilerini gönder
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });


  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // İstemci bağlantısı kesildiğinde çalışır
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} sohbetten ayrıldı`)
      );

      // Kullanıcıları ve oda bilgilerini gönder
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
