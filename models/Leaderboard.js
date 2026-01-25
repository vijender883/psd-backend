// models/Leaderboard.js
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  simulationId: {
    type: String,
    required: true
  },
  college: {
    type: String,
    default: 'Not specified'
  },
  mcqScore: {
    type: Number,
    default: 0
  },
  dsaScores: {
    type: Map,
    of: Number,
    default: {}
  },
  totalScore: {
    type: Number,
    required: true,
    default: 0
  },
  totalTimeTaken: {
    type: Number,
    default: 0
  },
  lastSubmissionTime: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'leaderboard_data'
});

// Create compound index on userId and simulationId for efficient lookups
LeaderboardSchema.index({ userId: 1, simulationId: 1 }, { unique: true });

// Create index on simulationId for leaderboard queries
LeaderboardSchema.index({ simulationId: 1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);