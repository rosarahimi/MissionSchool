const mongoose = require('mongoose');

const detailedResultSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correct: { type: Boolean, required: true },
  userAnswer: { type: String, default: '' },
  correctAnswer: { type: String, required: true }
}, { _id: false });

const performanceReportSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  subject: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  stars: { type: Number, default: 0 },
  badge: { type: String, default: null },
  detailedResults: [detailedResultSchema],
  lessonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson',
    default: null 
  },
  sessionDuration: { type: Number, default: 0 }, // in seconds
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes for common queries
performanceReportSchema.index({ studentId: 1, subject: 1, createdAt: -1 });
performanceReportSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('PerformanceReport', performanceReportSchema);
