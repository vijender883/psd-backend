// models/Simulation.js
const mongoose = require("mongoose");

const SimulationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Flattened test IDs
    mcqTests: {
      type: [String],
      default: [],
    },
    problemIds: {
      type: [String],
      default: [], // e.g., ["twoSum", "validAnagram"]
    },
    participationIds: {
      type: [String],
      default: [],
    },
    // Field for scheduled start time
    scheduledStartTime: {
      type: Date,
      default: null,
    },
    // Field for scheduled end time
    scheduledEndTime: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add method to check if results are available
SimulationSchema.methods.areResultsAvailable = function () {
  if (!this.scheduledEndTime) return true; // If not set, default to available
  const now = new Date();
  return now >= this.scheduledEndTime;
};

module.exports = mongoose.model("Simulation", SimulationSchema);
