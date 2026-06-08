require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');
const initSocket = require('./socket/socketHandler');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);

// ── Socket.io setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── REST Routes ──────────────────────────────────────────────────────────────
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── MongoDB & seed default rooms ─────────────────────────────────────────────
async function seedDefaultRooms() {
  const defaults = ['general', 'tech', 'random'];
  for (const name of defaults) {
    await Room.findOneAndUpdate(
      { name },
      { name, createdBy: 'system', isDefault: true },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Default rooms seeded');
}

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp')
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDefaultRooms();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ── Initialise Socket.io handler ─────────────────────────────────────────────
initSocket(io);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
