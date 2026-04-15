const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

/**
 * POST /api/tts/speech
 * Generates speech from text using OpenAI TTS API.
 * This acts as a server-side proxy to protect the OpenAI API key.
 */
router.post('/speech', auth, async (req, res) => {
  try {
    const { text, voice = 'alloy', model = 'tts-1' } = req.body;

    if (!text) {
      return res.status(400).json({ ok: false, message: 'Text is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, message: 'OPENAI_API_KEY is not configured on server' });
    }

    // Call OpenAI TTS API using axios
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model,
        input: text,
        voice,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Important for receiving binary audio data
        timeout: 15000,
      }
    );

    // Send the audio buffer back with the correct content type
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error('TTS Proxy Error:', err.response?.data || err.message);
    
    const statusCode = err.response?.status || 500;
    const errorMessage = err.response?.data?.error?.message || 'Failed to generate speech';
    
    res.status(statusCode).json({ 
      ok: false, 
      message: errorMessage 
    });
  }
});

module.exports = router;
