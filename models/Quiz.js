// models/Quiz.js
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledStartTime: {
    type: Date,
    default: null
  },
  lateJoinWindowMinutes: {
    type: Number,
    default: 5 // Default 5 minutes late join window
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);