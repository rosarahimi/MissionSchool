const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  page: { type: Number, required: true },
  text: { type: String, default: '' },
}, { _id: false });

const textbookTextSchema = new mongoose.Schema({
  grade: { type: Number, required: true, index: true },
  subject: { type: String, required: true, index: true },
  bucketName: { type: String, default: 'textbooks' },
  filename: { type: String, required: true },
  source: {
    tempPath: { type: String },
    fileId: { type: mongoose.Schema.Types.ObjectId },
  },
  extraction: {
    method: { type: String, enum: ['pdf-parse', 'ocr', 'mixed'], default: 'pdf-parse' },
    ocrLang: { type: String },
    extractedAt: { type: Date },
  },
  text: { type: String, default: '' },
  pages: [pageSchema],
}, { timestamps: true });

textbookTextSchema.index({ grade: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('TextbookText', textbookTextSchema);
