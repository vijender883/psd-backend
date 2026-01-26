const mongoose = require('mongoose');

const ActiveDSASchema = new mongoose.Schema({
    problemId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    simulationId: {
        type: String,
        default: "1"
    },
    duration: {
        type: Number,
        default: 30
    },
    activatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('ActiveDSA', ActiveDSASchema);
