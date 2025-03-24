// models/Leaderboard.js
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
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
    default: 0
  },
  lastSubmissionTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for unique userId-simulationId pairs
LeaderboardSchema.index({ userId: 1, simulationId: 1 }, { unique: true });
// Create index for efficient sorting
LeaderboardSchema.index({ simulationId: 1, totalScore: -1, lastSubmissionTime: 1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);