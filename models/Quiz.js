// models/Quiz.js
const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  scheduledStartTime: {
    type: Date,
    default: null,
  },
  scheduledEndTime: {
    type: Date,
    default: null,
  },
  resultsDeclarationTime: {
    type: Date,
    default: null,
  },
  lateJoinWindowMinutes: {
    type: Number,
    default: 5, // Default 5 minutes late join window
  },
  // Add field for when results become available (in hours after quiz starts)
  resultsAvailableAfterHours: {
    type: Number,
    default: 0.08, // Default 2 hours after quiz starts
  },
});

module.exports = mongoose.model("Quiz", QuizSchema);
