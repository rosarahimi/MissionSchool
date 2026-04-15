const mongoose = require('mongoose');

/**
 * SystemConfig — a single-document collection that holds platform-wide settings.
 * We always use the document with _id='global'.
 */
const systemConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },

  // TTS engine selection
  // 'browser' = Web Speech API (free, built-in, no Persian on iOS)
  // 'openai'  = OpenAI TTS via backend proxy (costs money, natural voice, all devices)
  ttsProvider: { type: String, enum: ['browser', 'openai'], default: 'browser' },

  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: '' },
}, { _id: false });

systemConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema, 'system_config');
