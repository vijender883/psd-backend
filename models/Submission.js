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
  // fields for LLM analysis
  isSuspicious: {
    type: Boolean,
    required: true,
    default: false
  },
  suspicionLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
    default: 'low'
  },
  suspicionReasons: [{
    type: String
  }],
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
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);