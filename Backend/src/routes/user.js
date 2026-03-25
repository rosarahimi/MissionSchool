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

// Update user profile (name)
router.post('/profile/update', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    
    await user.save();
    res.json({ message: 'Profile updated', user: { email: user.email, name: user.name } });
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
