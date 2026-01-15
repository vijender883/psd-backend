const Simulation = require("../models/Simulation");

/**
 * Add a new simulation
 * POST /add-simulation
 */
exports.addSimulation = async (req, res) => {
  try {
    const {
      title,
      description,
      mcqTests,
      problemIds, // User renamed dsaTests to problemIds
      scheduledStartTime,
      scheduledEndTime,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const newSimulation = new Simulation({
      title,
      description: description || "",
      mcqTests: mcqTests || [],
      problemIds: problemIds || [],
      scheduledStartTime: scheduledStartTime || null,
      scheduledEndTime: scheduledEndTime || null,
    });

    await newSimulation.save();

    res.status(201).json({
      success: true,
      message: "Simulation added successfully",
      simulation: newSimulation,
    });
  } catch (error) {
    console.error("Error adding simulation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add simulation: " + error.message,
    });
  }
};

/**
 * Get list of all simulations
 * GET /simulation-list
 */
exports.getSimulationList = async (req, res) => {
  try {
    const simulations = await Simulation.find()
      .select("-__v") // Exclude version key
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      simulations,
    });
  } catch (error) {
    console.error("Error fetching simulation list:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch simulation list",
    });
  }
};
