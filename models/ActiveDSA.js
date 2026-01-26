const mongoose = require('mongoose');

const ActiveDSASchema = new mongoose.Schema({
    problemId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    simulationId: {
        type: String,
        default: "1"
    },
    isActive: {
        type: Boolean,
        default: false
    },
    activationTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 30 // minutes
    }
}, { timestamps: true });

module.exports = mongoose.model('ActiveDSA', ActiveDSASchema);
