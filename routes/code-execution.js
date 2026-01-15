const express = require("express");
const router = express.Router();
const codeExecutionController = require("../controllers/codeExecutionController");

// Get list of problem IDs for a simulation
router.get(
  "/simulation/:simulationId/problems",
  codeExecutionController.getSimulationProblems
);

// Get problem details (without solution, limited test cases)
router.post("/simulation/problem", codeExecutionController.getProblemDetails);

// Run code (test run 3 cases)
// POST /simulations/run
router.post("/simulations/run", codeExecutionController.runSimulationCode);

// Submit Code (Run all test cases)
// POST /simulations/submit-problem
router.post(
  "/simulations/submit-problem",
  codeExecutionController.submitSimulationCode
);

// Get Simulation Time
router.get(
  "/simulation-time/:simulationId",
  codeExecutionController.getSimulationTime
);

module.exports = router;
