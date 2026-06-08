/**
 * socket/socketHandler.js
 * Production-grade Socket.io event handler.
 * - Input validation on every event
 * - Reuses shared message history helper (DRY)
 * - All async handlers wrapped in try/catch
 * - In-memory presence store (Map-based)
 */
const Message = require('../models/Message');
const { getRecentMessages } = require('../routes/messages');

/**
 * roomUsers: Map<roomName, Map<socketId, username>>
 * Tracks online users per room. In-memory — resets on process restart.
 */
const roomUsers = new Map();

/** Returns array of usernames currently in a room. */
function getUsersInRoom(room) {
  const users = roomUsers.get(room);
  return users ? Array.from(users.values()) : [];
}

/** Generate HH:MM AM/PM timestamp. */
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Validate that a value is a non-empty string.
 * Prevents undefined/null from poisoning the Maps and Mongoose.
 */
function isValidString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

module.exports = function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ room, username } = {}) => {
      // Input guard — reject invalid payloads silently
      if (!isValidString(room) || !isValidString(username)) {
        console.warn(`⚠️  join-room rejected: invalid room="${room}" username="${username}"`);
        return;
      }

      const cleanRoom = room.trim();
      const cleanUser = username.trim();

      // Leave all previous rooms
      const prevRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      prevRooms.forEach((prevRoom) => {
        socket.leave(prevRoom);
        const users = roomUsers.get(prevRoom);
        if (users) {
          users.delete(socket.id);
          io.to(prevRoom).emit('user-left', { username: cleanUser, room: prevRoom, timestamp: getTimestamp() });
          io.to(prevRoom).emit('online-users', { room: prevRoom, users: getUsersInRoom(prevRoom) });
        }
      });

      // Join new room & track presence
      socket.join(cleanRoom);
      if (!roomUsers.has(cleanRoom)) roomUsers.set(cleanRoom, new Map());
      roomUsers.get(cleanRoom).set(socket.id, cleanUser);

      console.log(`👤 ${cleanUser} joined #${cleanRoom}`);

      // Notify room
      socket.to(cleanRoom).emit('user-joined', { username: cleanUser, room: cleanRoom, timestamp: getTimestamp() });
      io.to(cleanRoom).emit('online-users', { room: cleanRoom, users: getUsersInRoom(cleanRoom) });

      // Load message history — reuses the shared helper from messages route
      try {
        const messages = await getRecentMessages(cleanRoom, 50);
        socket.emit('message-history', messages);
      } catch (err) {
        console.error(`❌ Failed to load history for #${cleanRoom}:`, err.message);
        socket.emit('message-history', []);
      }
    });

    // ─── LEAVE ROOM ───────────────────────────────────────────────────────────
    socket.on('leave-room', ({ room, username } = {}) => {
      if (!isValidString(room) || !isValidString(username)) return;

      const cleanRoom = room.trim();
      const cleanUser = username.trim();

      socket.leave(cleanRoom);
      const users = roomUsers.get(cleanRoom);
      if (users) {
        users.delete(socket.id);
        io.to(cleanRoom).emit('user-left', { username: cleanUser, room: cleanRoom, timestamp: getTimestamp() });
        io.to(cleanRoom).emit('online-users', { room: cleanRoom, users: getUsersInRoom(cleanRoom) });
      }
    });

    // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
    socket.on('send-message', async ({ room, username, content } = {}) => {
      if (!isValidString(room) || !isValidString(username) || !isValidString(content)) return;

      const cleanRoom = room.trim();
      const cleanUser = username.trim();
      const cleanContent = content.trim().slice(0, 2000); // max 2000 chars server-side

      const timestamp = getTimestamp();

      try {
        const msg = await Message.create({
          username: cleanUser,
          content: cleanContent,
          room: cleanRoom,
          timestamp,
        });

        io.to(cleanRoom).emit('receive-message', {
          _id: msg._id,
          username: cleanUser,
          content: msg.content,
          room: cleanRoom,
          timestamp,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error(`❌ Failed to save message in #${cleanRoom}:`, err.message);
        socket.emit('error-message', 'Message could not be sent. Please try again.');
      }
    });

    // ─── TYPING INDICATORS ────────────────────────────────────────────────────
    socket.on('typing', ({ room, username } = {}) => {
      if (!isValidString(room) || !isValidString(username)) return;
      socket.to(room.trim()).emit('typing', { username: username.trim(), room: room.trim() });
    });

    socket.on('stop-typing', ({ room, username } = {}) => {
      if (!isValidString(room) || !isValidString(username)) return;
      socket.to(room.trim()).emit('stop-typing', { username: username.trim(), room: room.trim() });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);

      roomUsers.forEach((users, room) => {
        if (users.has(socket.id)) {
          const username = users.get(socket.id);
          users.delete(socket.id);
          io.to(room).emit('user-left', { username, room, timestamp: getTimestamp() });
          io.to(room).emit('online-users', { room, users: getUsersInRoom(room) });
        }
      });
    });
  });
};
