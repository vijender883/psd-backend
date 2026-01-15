// models/Leaderboard.js
const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    simulationid: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    submitted_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "leaderboard_data",
  }
);

// Create compound index on userid and simulationid for efficient lookups
LeaderboardSchema.index({ userid: 1, simulationid: 1 }, { unique: true });

// Create index on simulationid for leaderboard queries
LeaderboardSchema.index({ simulationid: 1 });

// Static method to add or update leaderboard entry
LeaderboardSchema.statics.add_to_leaderboard = async function (
  simulationid,
  userid,
  username,
  score,
  submitted_time
) {
  try {
    console.log(
      `📊 Updating leaderboard: simulation=${simulationid}, user=${userid}, username=${username}, score=${score}`
    );

    // Try to find existing entry
    const existingEntry = await this.findOne({ userid, simulationid });

    if (existingEntry) {
      // Update existing entry: add new score to existing score
      const newScore = existingEntry.score + score;
      console.log(
        `✅ Found existing entry. Old score: ${existingEntry.score}, New score: ${newScore}`
      );

      const updatedEntry = await this.findOneAndUpdate(
        { userid, simulationid },
        {
          username, // Update username in case it changed
          score: newScore,
          submitted_time: submitted_time,
        },
        { new: true }
      );

      console.log(
        `🔄 Updated leaderboard entry for user ${userid} (${username}) in simulation ${simulationid}`
      );
      return updatedEntry;
    } else {
      // Create new entry
      const newEntry = new this({
        userid,
        username,
        simulationid,
        score,
        submitted_time,
      });

      const savedEntry = await newEntry.save();
      console.log(
        `🆕 Created new leaderboard entry for user ${userid} (${username}) in simulation ${simulationid}`
      );
      return savedEntry;
    }
  } catch (error) {
    console.error(
      `❌ Error in add_to_leaderboard for user ${userid} (${username}) in simulation ${simulationid}:`,
      error
    );
    throw error;
  }
};

// Static method to get leaderboard for a simulation with ranks
LeaderboardSchema.statics.getLeaderboard = async function (
  simulationid,
  limit = 50
) {
  try {
    const leaderboard = await this.find({ simulationid })
      .sort({ score: -1, submitted_time: 1 }) // Higher score first, then earlier submission time
      .limit(limit)
      .select("userid username score submitted_time -_id");

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userid: entry.userid,
      username: entry.username,
      score: entry.score,
      submitted_time: entry.submitted_time,
    }));

    return leaderboardWithRanks;
  } catch (error) {
    console.error(
      `❌ Error fetching leaderboard for simulation ${simulationid}:`,
      error
    );
    throw error;
  }
};

// Instance method to increment score
LeaderboardSchema.methods.incrementScore = function (
  additionalScore,
  newSubmittedTime
) {
  this.score += additionalScore;
  this.submitted_time = newSubmittedTime || new Date();
  return this.save();
};

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
