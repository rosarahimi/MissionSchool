const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile/history
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user score/badges
router.post('/progress', auth, async (req, res) => {
  try {
    const { subject, score, stars, badge } = req.body;
    const user = await User.findById(req.user.id);

    if (subject) {
      user.scores.push({ subject, score, stars });
    }

    if (badge && !user.badges.includes(badge)) {
      user.badges.push(badge);
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
