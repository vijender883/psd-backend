// models/Submission.js
const mongoose = require('mongoose');

// Connection error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});


const SubmissionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    required: true,
    default: false,
  },
  problemId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    default: 'java',
    enum: ['java', 'python'] // Only allow these two languages for now
  },
  executionTime: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  passedTests: {
    type: Number,
    required: true
  },
  totalTests: {
    type: Number,
    required: true
  },
  results: [{
    testCase: Number,
    passed: Boolean,
    input: String,
    expectedOutput: String,
    yourOutput: String,
    executionTime: Number,
    error: {
      message: String,
      stack: String
    }
  }],
  timeComplexity: {
    type: String,
    required: true
  },
  spaceComplexity: {
    type: String,
    required: true
  },
  // Enhanced fields for LLM analysis
  complexityAnalysis: {
    isTimeComplexityAccurate: {
      type: Boolean,
      required: true,
      default: true
    },
    isSpaceComplexityAccurate: {
      type: Boolean,
      required: true,
      default: true
    },
    actualTimeComplexity: {
      type: String,
      required: true
    },
    actualSpaceComplexity: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    improvement: {
      type: String,
      default: ""
    },
    optimizedSolution: {
      type: String,
      default: ""
    }
  },
  processingComplete: {
    type: Boolean,
    required: true,
    default: false
  },
  error: {
    message: String,
    stack: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SubmissionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);