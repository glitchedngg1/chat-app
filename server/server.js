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

// ── CORS origins ─────────────────────────────────────────────────────────────
// Supports comma-separated list in CLIENT_URL env var, plus localhost fallback
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

console.log('✅ Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`⚠️  CORS blocked: ${origin}`);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check — used to verify Railway deployment is alive
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' })
);

// ── MongoDB & seed default rooms ──────────────────────────────────────────────
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

// ── Initialise Socket.io handler ──────────────────────────────────────────────
initSocket(io);

// ── Start server ──────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Railway (and other cloud hosts) can route external traffic
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 MONGODB_URI set: ${!!process.env.MONGODB_URI}`);
  console.log(`🔗 CLIENT_URL: ${process.env.CLIENT_URL || 'not set (using localhost)'}`);
});
