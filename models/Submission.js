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

const submissionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
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
    description: String,
    input: String,
    expectedOutput: String,
    yourOutput: String,
    passed: Boolean,
    executionTime: Number,
    error: {
      message: String,
      stack: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);