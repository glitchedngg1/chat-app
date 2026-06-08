const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

/**
 * Shared helper: fetch last N messages for a room, sorted oldest-first.
 * Used by both this REST route and the socket handler to avoid duplication.
 *
 * @param {string} room
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentMessages(room, limit = 50) {
  const messages = await Message.find({ room })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return messages.reverse(); // oldest first for the chat window
}

// Export helper so socketHandler can reuse it
module.exports.getRecentMessages = getRecentMessages;

/**
 * GET /api/messages/:room
 * Returns the last 50 messages for a given room, sorted oldest-first.
 */
router.get('/:room', async (req, res, next) => {
  try {
    const { room } = req.params;

    // Basic input validation
    if (!room || room.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const messages = await getRecentMessages(room.trim());
    res.json({ success: true, messages });
  } catch (error) {
    next(error); // delegate to centralized error handler
  }
});

module.exports.router = router;
