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
  userIds: {
    type: [String],
    default: []
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

module.exports = mongoose.model('Simulation', SimulationSchema);