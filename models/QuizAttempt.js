// models/QuizAttempt.js
// Updated to include pointsEarned field for time-based scoring
const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedOption: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number // Time spent in seconds
    },
    pointsEarned: {
      type: Number,
      default: 0 // Points earned for this question (time-based)
    },
    alreadyCounted: {
      type: Boolean,
      default: false
    }
  }]
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);