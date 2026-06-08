const Message = require('../models/Message');

/**
 * roomUsers: Map<roomName, Map<socketId, username>>
 * Tracks which users are in each room.
 */
const roomUsers = new Map();

/**
 * Helper – returns an array of unique usernames currently in a room.
 */
function getUsersInRoom(room) {
  const users = roomUsers.get(room);
  if (!users) return [];
  return Array.from(users.values());
}

/**
 * Helper – generate a human-readable timestamp.
 */
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // -------------------------------------------------
    // JOIN ROOM
    // -------------------------------------------------
    socket.on('join-room', async ({ room, username }) => {
      // Leave all previous rooms (except the socket's own room)
      const prevRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      prevRooms.forEach((prevRoom) => {
        socket.leave(prevRoom);
        // Remove user from that room's tracker
        const users = roomUsers.get(prevRoom);
        if (users) {
          users.delete(socket.id);
          // Notify others in that room
          io.to(prevRoom).emit('user-left', { username, room: prevRoom });
          io.to(prevRoom).emit('online-users', {
            room: prevRoom,
            users: getUsersInRoom(prevRoom),
          });
        }
      });

      // Join new room
      socket.join(room);

      // Track user
      if (!roomUsers.has(room)) roomUsers.set(room, new Map());
      roomUsers.get(room).set(socket.id, username);

      console.log(`👤 ${username} joined room: ${room}`);

      // Broadcast "user joined" to others (not sender)
      socket.to(room).emit('user-joined', {
        username,
        room,
        timestamp: getTimestamp(),
      });

      // Send updated online users list to everyone in room
      io.to(room).emit('online-users', {
        room,
        users: getUsersInRoom(room),
      });

      // Load last 50 messages from DB and send to joining user only
      try {
        const messages = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit('message-history', messages.reverse());
      } catch (err) {
        console.error('Failed to load message history:', err.message);
        socket.emit('message-history', []);
      }
    });

    // -------------------------------------------------
    // LEAVE ROOM
    // -------------------------------------------------
    socket.on('leave-room', ({ room, username }) => {
      socket.leave(room);
      const users = roomUsers.get(room);
      if (users) {
        users.delete(socket.id);
        io.to(room).emit('user-left', { username, room, timestamp: getTimestamp() });
        io.to(room).emit('online-users', {
          room,
          users: getUsersInRoom(room),
        });
      }
    });

    // -------------------------------------------------
    // SEND MESSAGE
    // -------------------------------------------------
    socket.on('send-message', async ({ room, username, content }) => {
      if (!content || !content.trim()) return;

      const timestamp = getTimestamp();

      // Persist to MongoDB
      try {
        const msg = await Message.create({ username, content: content.trim(), room, timestamp });

        // Broadcast to everyone in the room (including sender)
        io.to(room).emit('receive-message', {
          _id: msg._id,
          username,
          content: msg.content,
          room,
          timestamp,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error('Failed to save message:', err.message);
        socket.emit('error-message', 'Message could not be sent. Try again.');
      }
    });

    // -------------------------------------------------
    // TYPING INDICATORS
    // -------------------------------------------------
    socket.on('typing', ({ room, username }) => {
      socket.to(room).emit('typing', { username, room });
    });

    socket.on('stop-typing', ({ room, username }) => {
      socket.to(room).emit('stop-typing', { username, room });
    });

    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);

      // Remove user from all tracked rooms and notify
      roomUsers.forEach((users, room) => {
        if (users.has(socket.id)) {
          const username = users.get(socket.id);
          users.delete(socket.id);

          io.to(room).emit('user-left', { username, room, timestamp: getTimestamp() });
          io.to(room).emit('online-users', {
            room,
            users: getUsersInRoom(room),
          });
        }
      });
    });
  });
};
