// models/Simulation.js
const mongoose = require("mongoose");

// Define schema for test cases
const TestCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Define schema for examples
const ExampleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    input: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Define schema for miscellaneous information
const MiscellaneousSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Define schema for code templates
// Line 50-58
const TemplatesSchema = new mongoose.Schema(
  {
    java: {
      type: String,
      default: "",
    },
    python: {
      type: String,
      default: "",
    },
    javascript: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Define schema for DSA questions
const DSAQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    inputFormat: {
      type: String,
      required: true,
    },
    outputFormat: {
      type: String,
      required: true,
    },
    constraints: {
      type: [String],
      default: [],
    },
    examples: {
      type: [ExampleSchema],
      default: [],
    },
    miscellaneous: {
      type: MiscellaneousSchema,
      default: {},
    },
    templates: {
      type: TemplatesSchema,
      default: {},
    },
    solution: {
      type: String,
      default: "",
    },
    testCases: {
      type: [TestCaseSchema],
      default: [],
    },
  },
  { _id: false }
);

const SimulationSchema = new mongoose.Schema(
  {
    simulationId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    testsId: {
      mcqTests: [String],
      dsaTests: [String],
    },
    participationIds: {
      type: [String],
      default: [],
    },
    // Updated field for DSA questions with proper schema
    dsa_questions: {
      type: [DSAQuestionSchema],
      default: [],
    },
    // Field for scheduled start time
    scheduled_start_time: {
      type: Date,
      default: null,
    },
    // Single field for controlling visibility
    resultsAvailableTime: {
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

// Create index on simulationId for faster lookups
SimulationSchema.index({ simulationId: 1 });

// Add method to check if results are available
SimulationSchema.methods.areResultsAvailable = function () {
  if (!this.resultsAvailableTime) return true; // If not set, default to available
  const now = new Date();
  return now >= this.resultsAvailableTime;
};

// Add method to add a DSA question
SimulationSchema.methods.addDSAQuestion = function (questionData) {
  this.dsa_questions.push(questionData);
  return this.save();
};

// Add method to get a specific DSA question by ID
SimulationSchema.methods.getDSAQuestionById = function (questionId) {
  return this.dsa_questions.find((question) => question.id === questionId);
};

// Add method to update a DSA question
SimulationSchema.methods.updateDSAQuestion = function (questionId, updateData) {
  const questionIndex = this.dsa_questions.findIndex(
    (question) => question.id === questionId
  );
  if (questionIndex !== -1) {
    Object.assign(this.dsa_questions[questionIndex], updateData);
    return this.save();
  }
  return null;
};

// Add method to remove a DSA question
SimulationSchema.methods.removeDSAQuestion = function (questionId) {
  this.dsa_questions = this.dsa_questions.filter(
    (question) => question.id !== questionId
  );
  return this.save();
};

module.exports = mongoose.model("Simulation", SimulationSchema);
