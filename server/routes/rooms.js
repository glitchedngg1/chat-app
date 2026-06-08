const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

/**
 * GET /api/rooms
 * Returns all available rooms (default + user-created).
 */
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ isDefault: -1, createdAt: 1 }).lean();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
});

/**
 * POST /api/rooms
 * Create a new custom room.
 * Body: { name: string, createdBy: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, createdBy } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    // Sanitise: lowercase, hyphenated
    const sanitised = name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check for duplicates
    const existing = await Room.findOne({ name: sanitised });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Room already exists' });
    }

    const room = await Room.create({
      name: sanitised,
      createdBy: createdBy || 'anonymous',
      isDefault: false,
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error('Error creating room:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
});

module.exports = router;
