const express = require("express");
const router = express.Router();
const Problem = require("../models/Problem");

// Create a new problem
router.post("/", async (req, res) => {
  try {
    const {
      problemId,
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      functionName,
      className,
      testCases,
      timeComplexity,
      spaceComplexity,
    } = req.body;

    // Validate required fields
    if (!problemId || !title || !description || !functionName || !testCases) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: problemId, title, description, functionName, testCases",
      });
    }

    // Check if problem already exists
    const existingProblem = await Problem.findOne({ problemId });
    if (existingProblem) {
      return res.status(409).json({
        success: false,
        error: `Problem with ID ${problemId} already exists`,
      });
    }

    const newProblem = new Problem({
      problemId,
      title,
      description,
      inputFormat: inputFormat || "",
      outputFormat: outputFormat || "",
      constraints: constraints || [],
      functionName,
      className: className || "", // Optional
      testCases,
      timeComplexity: timeComplexity || "",
      spaceComplexity: spaceComplexity || "",
    });

    await newProblem.save();

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      data: newProblem,
    });
  } catch (error) {
    console.error("Error creating problem:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create problem: " + error.message,
    });
  }
});

// Get all problems (Optional separate endpoint, but keeping consistent with request to have "routes for THIS endpoint")
router.get("/", async (req, res) => {
  try {
    const problems = await Problem.find(
      {},
      {
        problemId: 1,
        title: 1,
        description: 1,
      }
    );
    res.json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
