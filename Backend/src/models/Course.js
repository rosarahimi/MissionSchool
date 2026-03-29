const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  grade: { type: Number, required: true, index: true },
  subject: { type: String, required: true, index: true },
  buildNumber: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  textbook: {
    bucketName: { type: String, default: 'textbooks' },
    filename: { type: String },
    fileId: { type: mongoose.Schema.Types.ObjectId },
  },
  meta: {
    publisher: String,
    year: String,
    language: { type: String, default: 'fa' },
  },
}, { timestamps: true });

courseSchema.index({ grade: 1, subject: 1, buildNumber: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
