const fs = require("fs").promises;
const path = require("path");
const Submission = require("../models/Submission");
const Simulation = require("../models/Simulation");
const { executeGenericPython } = require("../services/codeExecutor");
const mongoose = require("mongoose");

// Helper to get problem data from file
async function getProblemData(problemId) {
  const problemPath = path.join(
    __dirname,
    "..",
    "problems",
    `${problemId}.json`
  );
  try {
    await fs.access(problemPath);
    const data = await fs.readFile(problemPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Get list of problem IDs for a simulation
 * GET /simulation/:simulationId/problems
 */
exports.getSimulationProblems = async (req, res) => {
  try {
    const { simulationId } = req.params;

    // fetch the simulations object using objectId
    const simulation = await Simulation.findById(simulationId);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: "Simulation not found",
      });
    }

    res.json({
      success: true,
      problemIds: simulation.problemIds || [],
    });
  } catch (error) {
    console.error("Error fetching simulation problems:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch simulation problems",
    });
  }
};

/**
 * Get problem details (without solution, limited test cases)
 * POST /simulation/problem
 */
exports.getProblemDetails = async (req, res) => {
  try {
    const { simulationId, problemId, userId } = req.body;

    if (!problemId) {
      return res
        .status(400)
        .json({ success: false, error: "problemId is required" });
    }

    // 1. Get Problem Data from file
    const problemData = await getProblemData(problemId);
    if (!problemData) {
      return res
        .status(404)
        .json({ success: false, error: "Problem not found" });
    }

    // 2. Filter data (remove solution, limit test cases)
    const { solution, test_cases, ...safeData } = problemData;
    const limitedTestCases = test_cases ? test_cases.slice(0, 2) : [];

    // 3. Check for existing submission
    let isSubmitted = false;
    let savedCode = "";

    if (userId) {
      const submission = await Submission.findOne({ userId, problemId });
      if (submission) {
        isSubmitted = submission.isSubmitted;
        savedCode = submission.code;
      }
    }

    res.json({
      success: true,
      problem: {
        ...safeData,
        test_cases: limitedTestCases,
      },
      isSubmitted,
      code: savedCode,
    });
  } catch (error) {
    console.error("Error fetching problem details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch problem details",
    });
  }
};

/**
 * Run code (test run 3 cases)
 * POST /simulations/run
 */
exports.runSimulationCode = async (req, res) => {
  try {
    const {
      simulationId,
      userId,
      userName,
      problemId,
      code,
      pseudocode,
      language = "python", // default to python
    } = req.body;

    if (!userId || !problemId || !code) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // 1. Check if already submitted
    const existingSubmission = await Submission.findOne({ userId, problemId });
    if (existingSubmission && existingSubmission.isSubmitted) {
      return res.status(400).json({
        success: false,
        error: "You have already submitted this problem.",
      });
    }

    // 2. Fetch full problem data to get test cases
    const problemData = await getProblemData(problemId);
    if (!problemData) {
      return res
        .status(404)
        .json({ success: false, error: "Problem definition not found" });
    }

    // 3. Prepare first 3 test cases for run
    const runTestCases = problemData.test_cases.slice(0, 3);

    // We need to construct a temporary problem definition with ONLY these 3 test cases
    // so executeGenericPython runs only them.
    // OR we run all and filter result?
    // `executeGenericPython` takes `problemId` OR `problemDefinition` (if we modify it).
    // Currently `executeGenericPython` takes `problemId` and reads file itself.
    // We need to modify `executeGenericPython` OR create a temp file.
    // EASIER: The python runner receives a payload. We can create a temporary payload object here
    // and pass it to a modified `executeGenericPython`.
    // Modification to `services/codeExecutor.js` was planned in step 1 ("Update executeGenericPython...").
    // I will assume `executeGenericPython` supports passing overrides OR I will do it here.
    // Actually, `executeGenericPython` currently loads from file.
    // I should probably UPDATE `executeGenericPython` to accept `testCases` override.

    // Let's modify `executeGenericPython` in `services/codeExecutor.js` to accept `problemData` override.
    // For now, I will use `executeGenericPython` as is, but that runs ALL tests.
    // The user wants "run the problem on the first three test cases".
    // I should implement passing specific test cases to the runner.
    // Use `executeCode` style?
    // `runner.py` reads `payload.json`. Payload has `problem`.

    // I will refactor `executeGenericPython` in `services/codeExecutor.js` to optionally take a `problemData` object.
    // If passed, use it.

    const tempProblemData = {
      ...problemData,
      test_cases: runTestCases,
    };

    // Call generic runner with explicit problem data
    // Call generic runner with explicit problem data
    console.log(
      `[Run] Executing generic python runner with ${runTestCases.length} test cases...`
    );
    const result = await executeGenericPython(code, problemId, tempProblemData);
    console.log(
      `[Run] Execution result:`,
      JSON.stringify(result).substring(0, 200) + "..."
    );

    // 4. Save/Update Submission (Upsert)
    await Submission.findOneAndUpdate(
      { userId, problemId },
      {
        username: userName,
        userId,
        problemId,
        code,
        pseudocode: pseudocode || "",
        language,
        isSubmitted: false, // Ensure it remains not submitted
        // map result to schema requirements?
        // The generic runner returns formatted results.
        // We need `executionTime`, `score`, `passedTests`, `totalTests`
        executionTime: 0, // generic runner currently generic
        score: 0,
        passedTests: result.results
          ? result.results.filter((r) => r.passed).length
          : 0,
        totalTests: result.results ? result.results.length : 0,
        processingComplete: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(result);
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({
      success: false,
      error: "Execution failed: " + error.message,
    });
  }
};

/**
 * Submit Code (Run all test cases)
 * POST /simulations/submit-problem
 */
exports.submitSimulationCode = async (req, res) => {
  try {
    const {
      simulationId,
      userId,
      userName,
      problemId,
      code,
      timeComplexity,
      spaceComplexity,
      pseudocode,
      language = "python",
    } = req.body;

    if (!userId || !problemId || !code) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // 1. Check if already submitted
    const existingSubmission = await Submission.findOne({ userId, problemId });
    if (existingSubmission && existingSubmission.isSubmitted) {
      return res.status(400).json({
        success: false,
        error: "You have already submitted this problem.",
      });
    }

    // 2. Run all test cases
    // Pass null for problemData to force loading full problem from file
    // 2. Run all test cases
    // Pass null for problemData to force loading full problem from file
    console.log(`[Submit] Running all test cases...`);
    const result = await executeGenericPython(code, problemId, null);
    console.log(
      `[Submit] Result:`,
      JSON.stringify(result).substring(0, 200) + "..."
    );

    // 3. Calculate metrics
    const passedTests = result.results
      ? result.results.filter((r) => r.passed).length
      : 0;
    const totalTests = result.results ? result.results.length : 0;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // 4. Save Submission (isSubmitted = true)
    await Submission.findOneAndUpdate(
      { userId, problemId },
      {
        username: userName,
        userId,
        problemId,
        code,
        timeComplexity: timeComplexity || "",
        spaceComplexity: spaceComplexity || "",
        pseudocode: pseudocode || "",
        language,
        isSubmitted: true,
        executionTime: 0, // To do: extract time from runner
        score,
        passedTests,
        totalTests,
        results: result.results || [],
        processingComplete: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      results: result.results,
      isSubmitted: true,
      score,
    });
  } catch (error) {
    console.error("Error submitting code:", error);
    res.status(500).json({
      success: false,
      error: "Submission failed: " + error.message,
    });
  }
};

/**
 * Get Simulation Time
 * GET /simulation-time/:simulationId
 */
exports.getSimulationTime = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const simulation = await Simulation.findById(simulationId);

    if (!simulation) {
      return res
        .status(404)
        .json({ success: false, error: "Simulation not found" });
    }

    res.json({
      success: true,
      startTime: simulation.scheduledStartTime,
      endTime: simulation.scheduledEndTime,
    });
  } catch (error) {
    console.error("Error getting simulation time:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get simulation time",
    });
  }
};
