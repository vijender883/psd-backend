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
  totalPassedTests: {
    type: Number,
    default: 0
  },
  totalTestsCount: {
    type: Number,
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

// Static method to add or update leaderboard entry
LeaderboardSchema.statics.add_to_leaderboard = async function (simulationId, userId, username, score, submittedTime) {
  try {
    // We'll reuse the existing updateSingleUserLeaderboard logic indirectly
    // By simply ensuring an entry exists. The route's GET will "heal" it.
    // However, for immediate update, we can do a basic upsert here.
    return await this.findOneAndUpdate(
      { userId: userId.trim(), simulationId },
      {
        $set: {
          username: username,
          lastSubmissionTime: submittedTime
        }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error in add_to_leaderboard:', err);
    throw err;
  }
};

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);