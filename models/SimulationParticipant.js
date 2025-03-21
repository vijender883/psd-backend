// models/SimulationParticipant.js
const mongoose = require('mongoose');

const SimulationParticipantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  simulationId: {
    type: String,
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  mcqAttemptId: {
    type: String,
    default: null
  },
  dsaSubmissionIds: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Create a compound index for unique userId-simulationId pairs
SimulationParticipantSchema.index({ userId: 1, simulationId: 1 }, { unique: true });

module.exports = mongoose.model('SimulationParticipant', SimulationParticipantSchema);