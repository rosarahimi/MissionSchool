const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  number: { type: Number, required: true },
  title: { type: String, required: true },
  summary: { type: String },
  origin: { type: String, enum: ['build', 'manual'], default: 'manual', index: true },
  source: {
    chunkIds: [{ type: mongoose.Schema.Types.ObjectId }],
    chunkRange: {
      from: Number,
      to: Number,
    },
  },
}, { timestamps: true });

chapterSchema.index({ courseId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);
