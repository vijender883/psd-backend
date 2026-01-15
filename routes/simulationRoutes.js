const express = require("express");
const router = express.Router();
const simulationController = require("../controllers/simulationController");

// Add a new simulation
router.post("/add-simulation", simulationController.addSimulation);

// Get list of all simulations
router.get("/simulation-list", simulationController.getSimulationList);

module.exports = router;
