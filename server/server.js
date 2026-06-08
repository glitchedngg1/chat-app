/**
 * server.js — Production-grade entry point.
 *
 * Startup sequence (order matters):
 * 1. Load & validate environment variables
 * 2. Connect to MongoDB Atlas — FAIL FAST if not reachable
 * 3. Seed default rooms
 * 4. Start HTTP + Socket.io server
 *
 * This ensures the server never accepts traffic before the DB is ready.
 */

// ─── 1. Environment ───────────────────────────────────────────────────────────
require('dotenv').config();

// Validate required environment variables at startup — fail immediately if missing
const REQUIRED_ENV = ['MONGODB_URI'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Set them in your Render dashboard (Environment → Add Variable)');
  process.exit(1);
}

// ─── 2. Imports ───────────────────────────────────────────────────────────────
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { router: messageRouter } = require('./routes/messages');
const roomRouter = require('./routes/rooms');
const initSocket = require('./socket/socketHandler');
const Room = require('./models/Room');

// ─── 3. Express + HTTP server ─────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── 4. CORS ──────────────────────────────────────────────────────────────────
// CLIENT_URL can be comma-separated for multiple origins (e.g. preview + production)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Return false (not an Error) — cleaner for clients
    callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ─── 5. Socket.io ─────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Ping timeout/interval — keeps connections alive on Render's infrastructure
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── 6. Middleware ────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks

// ─── 7. Routes ────────────────────────────────────────────────────────────────
app.use('/api/messages', messageRouter);
app.use('/api/rooms', roomRouter);

// Health check — configure this path in Render's health check settings
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV || 'development',
    mongoState: ['disconnected', 'connected', 'connecting', 'disconnecting'][
      require('mongoose').connection.readyState
    ] || 'unknown',
  });
});

// ─── 8. 404 + Error handlers (MUST be after all routes) ──────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── 9. Socket.io handler ────────────────────────────────────────────────────
initSocket(io);

// ─── 10. Seed default rooms ───────────────────────────────────────────────────
async function seedDefaultRooms() {
  const defaults = ['general', 'tech', 'random'];
  for (const name of defaults) {
    await Room.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, createdBy: 'system', isDefault: true } },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Default rooms seeded (general, tech, random)');
}

// ─── 11. Graceful shutdown ────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    require('mongoose').connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  // Force shutdown after 10s if something hangs
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections — log and exit so Render can restart
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// ─── 12. Bootstrap: DB first, then listen ────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Connect to MongoDB BEFORE starting the HTTP server
    await connectDB();
    await seedDefaultRooms();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
