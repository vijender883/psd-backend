// models/QuizAttempt.js
// Updated to reference Quiz model for results availability time
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
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  // Auto-calculated field for when results will be available
  resultsAvailableAt: {
    type: Date
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

// Method to check if results are available
QuizAttemptSchema.methods.areResultsAvailable = function() {
  if (!this.resultsAvailableAt) return false;
  const now = new Date();
  return now >= this.resultsAvailableAt;
};

// Method to get time remaining until results are available (in milliseconds)
QuizAttemptSchema.methods.getTimeUntilResultsAvailable = function() {
  if (!this.resultsAvailableAt) return Infinity;
  const now = new Date();
  const timeRemaining = this.resultsAvailableAt.getTime() - now.getTime();
  return Math.max(0, timeRemaining); // Ensure it doesn't return negative values
};

// Pre-save middleware to set resultsAvailableAt based on Quiz model
QuizAttemptSchema.pre('save', async function(next) {
  // Only set resultsAvailableAt if it's not already set and we have startedAt
  if (!this.resultsAvailableAt && this.startedAt) {
    try {
      // Fetch the quiz to get the resultsAvailableAfterHours value
      const Quiz = mongoose.model('Quiz');
      const quiz = await Quiz.findById(this.quizId);
      
      if (quiz) {
        const resultsTime = new Date(this.startedAt);
        // Use the hours from the quiz model or default to 2
        resultsTime.setHours(resultsTime.getHours() + (quiz.resultsAvailableAfterHours || 2));
        this.resultsAvailableAt = resultsTime;
      }
    } catch (error) {
      console.error('Error setting resultsAvailableAt:', error);
    }
  }
  next();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);