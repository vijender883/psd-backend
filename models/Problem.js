const mongoose = require("mongoose");

const TestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const ProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    inputFormat: { type: String, required: true },
    outputFormat: { type: String, required: true },
    constraints: { type: [String], default: [] },

    // New fields for generic execution
    functionName: { type: String, required: true }, // e.g., "twoSum"
    className: { type: String, default: "Solution" }, // e.g., "Solution"

    testCases: { type: [TestCaseSchema], default: [] },

    // Optional: Complexity constraints for analysis
    timeComplexity: { type: String, default: "" },
    spaceComplexity: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProblemSchema.index({ problemId: 1 });

module.exports = mongoose.model("Problem", ProblemSchema);
