const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

/**
 * GET /api/rooms
 * Returns all available rooms (default rooms first, then by creation date).
 */
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ isDefault: -1, createdAt: 1 }).lean();
    res.json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rooms
 * Create a new custom room.
 * Body: { name: string, createdBy: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, createdBy } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }
    if (name.trim().length > 30) {
      return res.status(400).json({ success: false, message: 'Room name must be 30 characters or fewer' });
    }

    // Sanitise: lowercase, spaces → hyphens, strip non-alphanumeric (except hyphens)
    const sanitised = name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (sanitised.length === 0) {
      return res.status(400).json({ success: false, message: 'Room name contains no valid characters' });
    }

    // Use findOneAndUpdate with upsert to atomically avoid race conditions.
    // If the room exists, it returns the existing doc without creating a duplicate.
    const room = await Room.findOneAndUpdate(
      { name: sanitised },
      { $setOnInsert: { name: sanitised, createdBy: createdBy || 'anonymous', isDefault: false } },
      { upsert: true, new: true, runValidators: true }
    );

    // Mongoose doesn't tell us if the doc was inserted or found without extra work.
    // We distinguish by checking if createdAt ≈ now (within 2s).
    const isNew = Date.now() - new Date(room.createdAt).getTime() < 2000;

    if (!isNew) {
      return res.status(409).json({ success: false, message: 'Room already exists' });
    }

    res.status(201).json({ success: true, room });
  } catch (error) {
    // Mongoose duplicate key error (code 11000) — belt-and-suspenders
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Room already exists' });
    }
    next(error);
  }
});

module.exports = router;
