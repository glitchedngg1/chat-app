const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: String, // human-readable "HH:MM AM/PM"
      required: true,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Index for fast room-based queries, sorted by creation time
MessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
