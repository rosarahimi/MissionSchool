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
  subject: { type: String, required: true, index: true },
  chapter: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  missions: [missionSchema]
});

module.exports = mongoose.model('Lesson', lessonSchema);
