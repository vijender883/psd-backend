// models/Simulation.js
const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  testsId: {
    mcqTests: [String],
    dsaTests: [String] 
  },
  participationIds: {
    type: [String],
    default: []
  },
  // New field for DSA questions array
  dsa_questions: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  // New field for scheduled start time
  scheduled_start_time: {
    type: Date,
    default: null
  },
  // Single field for controlling visibility
  resultsAvailableTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index on simulationId for faster lookups
SimulationSchema.index({ simulationId: 1 });

// Add method to check if results are available
SimulationSchema.methods.areResultsAvailable = function() {
  if (!this.resultsAvailableTime) return true; // If not set, default to available
  const now = new Date();
  return now >= this.resultsAvailableTime;
};

module.exports = mongoose.model('Simulation', SimulationSchema);