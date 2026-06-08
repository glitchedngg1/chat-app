/**
 * config/db.js
 * Centralized MongoDB connection with Atlas-ready options.
 * Exported as a function so server.js can await it before starting.
 */
const mongoose = require('mongoose');

// Silence Mongoose 7+ strictQuery deprecation warning
mongoose.set('strictQuery', false);

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set — attempting localhost fallback (will fail on Render)');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
