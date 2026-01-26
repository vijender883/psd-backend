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
  timeTaken: {
    type: Number,
    default: 0
  },
  show: {
    type: Boolean,
    required: true,
    default: false,
  },
  isSubmitted: {
    type: Boolean,
    required: true,
    default: false
  },
  problemId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  pseudocode: {
    type: String,
    default: ''
  },
  timeComplexity: {
    type: String,
    default: ''
  },
  spaceComplexity: {
    type: String,
    default: ''
  },
  geminiReview: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    required: true,
    default: 'java',
    enum: ['java', 'python', 'javascript', 'apex']
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