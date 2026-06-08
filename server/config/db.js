/**
 * config/db.js
 * Centralized MongoDB connection with Atlas-ready options.
 * Exported as a function so server.js can await it before starting.
 */
const mongoose = require('mongoose');

// Silence Mongoose 7+ strictQuery deprecation warning
mongoose.set('strictQuery', false);

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Hard stop — no silent fallback to localhost in production
    throw new Error(
      'MONGODB_URI environment variable is not set. ' +
        'Set it in your Render dashboard or .env file.'
    );
  }

  await mongoose.connect(uri, {
    // Atlas-recommended options
    serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
