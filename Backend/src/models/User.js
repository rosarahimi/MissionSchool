const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  scores: [{
    subject: String,
    score: Number,
    stars: Number,
    date: { type: Date, default: Date.now }
  }],
  badges: [String],
  lessonProgress: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    read: { type: Boolean, default: false },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
