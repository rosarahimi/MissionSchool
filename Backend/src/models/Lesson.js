const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'fill', 'order'], required: true },
  stage: { type: Number, required: true },
  q: { type: String, required: true },
  options: [String],
  answer: mongoose.Schema.Types.Mixed,
  blank: String,
  hint: String,
  words: [String],
  exp: { type: String, required: true }
});

const lessonSchema = new mongoose.Schema({
  grade: { type: Number, index: true },
  subject: { type: String, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', index: true },
  chapter: { type: Number, required: true },
  orderIndex: { type: Number, default: 0 },
  title: { type: String, required: true },
  content: { type: String, required: true },
  origin: { type: String, enum: ['build', 'manual'], default: 'manual', index: true },
  missions: [missionSchema],
  source: {
    chunkIds: [{ type: mongoose.Schema.Types.ObjectId }],
    chunkRange: {
      from: Number,
      to: Number,
    },
  }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
