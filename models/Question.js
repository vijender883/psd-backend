// models/Question.js
// Defines the Question schema with options and correct answer
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  timeLimit: {
    type: Number, // Time in seconds
    required: true
  },
  order: {
    type: Number, // Question order in the quiz
    required: true
  }
});

module.exports = mongoose.model('Question', QuestionSchema);