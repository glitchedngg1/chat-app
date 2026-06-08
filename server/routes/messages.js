const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

/**
 * GET /api/messages/:room
 * Returns the last 50 messages for a given room, sorted oldest-first
 * so the client can render them in chronological order.
 */
router.get('/:room', async (req, res) => {
  try {
    const { room } = req.params;

    const messages = await Message.find({ room })
      .sort({ createdAt: -1 }) // newest first from DB
      .limit(50)
      .lean();

    // Reverse so oldest is first for the chat window
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

module.exports = router;
