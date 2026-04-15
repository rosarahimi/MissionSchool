const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

// Public — any authenticated or unauthenticated client can read system settings
// This lets the frontend decide which TTS engine to use without needing admin role
router.get('/config', async (req, res) => {
  try {
    let cfg = await SystemConfig.findById('global').lean();
    if (!cfg) {
      // Return defaults if no config has been saved yet
      cfg = { ttsProvider: 'browser' };
    }
    // Only expose safe, public fields
    res.json({ ok: true, ttsProvider: cfg.ttsProvider || 'browser' });
  } catch (err) {
    console.error('System config read error:', err);
    // On error, fall back to browser so TTS still works
    res.json({ ok: true, ttsProvider: 'browser' });
  }
});

module.exports = router;
