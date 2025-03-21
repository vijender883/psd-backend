// routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const Simulation = require('../models/Simulation');
const SimulationParticipant = require('../models/SimulationParticipant'); // Keep for backward compatibility

// Initialize simulations
const initializeSimulations = async () => {
  try {
    // Check if simulations already exist
    const count = await Simulation.countDocuments();
    
    if (count === 0) {
      // Create initial simulations if none exist
      await Simulation.create([
        {
          simulationId: "1",
          title: "Algorithmic Problem Solving",
          description: "Test your DSA skills with coding and MCQ tests",
          testsId: {
            mcqTests: [], // Will be dynamically populated
            dsaTests: ["countconsecutive", "closestvalueinrotatedarray"]
          },
          userIds: []
        },
        {
          simulationId: "2",
          title: "Database Design Challenge",
          description: "Practice database schema design and SQL queries",
          testsId: {
            mcqTests: [], // Will be dynamically populated
            dsaTests: ["longestincreasing", "longestcommonprefix"]
          },
          userIds: []
        }
      ]);
      
      console.log('Simulations initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing simulations:', error);
  }
};

// Call this function when the server starts
initializeSimulations();

// Register user for a simulation
router.post('/participants', async (req, res) => {
  try {
    const { userId, simulationId } = req.body;
    
    if (!userId || !simulationId) {
      return res.status(400).json({
        success: false,
        error: 'userId and simulationId are required'
      });
    }
    
    console.log('Registering user for simulation:', { userId, simulationId });
    
    // Find the simulation
    let simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    // Check if user is already registered
    if (simulation.userIds.includes(userId)) {
      console.log('User already registered:', { userId, simulationId });
      
      // Still create/update SimulationParticipant for backward compatibility
      let participant;
      try {
        participant = await SimulationParticipant.findOneAndUpdate(
          { userId, simulationId },
          { userId, simulationId },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Error updating SimulationParticipant:', err);
      }
      
      return res.json({
        success: true,
        registered: true,
        message: 'User already registered for this simulation',
        participant
      });
    }
    
    // Add user to the simulation
    simulation = await Simulation.findOneAndUpdate(
      { simulationId },
      { $addToSet: { userIds: userId } },
      { new: true }
    );
    
    // Create SimulationParticipant for backward compatibility
    let participant;
    try {
      participant = await SimulationParticipant.create({
        userId,
        simulationId
      });
    } catch (error) {
      // If error is due to duplicate key, just find the existing record
      if (error.code === 11000) {
        participant = await SimulationParticipant.findOne({ userId, simulationId });
      } else {
        console.error('Error creating SimulationParticipant:', error);
      }
    }
    
    res.status(201).json({
      success: true,
      registered: true,
      message: 'User successfully registered for simulation',
      participant,
      simulation
    });
    
  } catch (error) {
    console.error('Error registering for simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for simulation: ' + error.message
    });
  }
});

// Check if user is registered for a simulation
router.get('/participants/:userId/:simulationId', async (req, res) => {
  try {
    const { userId, simulationId } = req.params;
    
    console.log('Checking if user is registered:', { userId, simulationId });
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId provided'
      });
    }
    
    if (!simulationId) {
      return res.status(400).json({
        success: false,
        error: 'simulationId is required'
      });
    }
    
    // Find the simulation
    const simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    // Check if user is registered
    const isRegistered = simulation.userIds.includes(userId);
    
    if (isRegistered) {
      console.log('User is registered:', { userId, simulationId });
      
      // Get participant details for backward compatibility
      const participant = await SimulationParticipant.findOne({ userId, simulationId });
      
      res.json({
        success: true,
        registered: true,
        simulation,
        participant
      });
    } else {
      console.log('User is NOT registered:', { userId, simulationId });
      res.json({
        success: true,
        registered: false,
        simulation
      });
    }
  } catch (error) {
    console.error('Error checking simulation registration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check simulation registration: ' + error.message
    });
  }
});

// Update MCQ attempt ID
router.put('/participants/:userId/:simulationId/mcq', async (req, res) => {
  try {
    const { userId, simulationId } = req.params;
    const { mcqAttemptId } = req.body;
    
    console.log('Updating MCQ attempt ID:', { userId, simulationId, mcqAttemptId });
    
    if (!mcqAttemptId) {
      return res.status(400).json({
        success: false,
        error: 'mcqAttemptId is required'
      });
    }
    
    // Find the simulation first to ensure user is registered
    const simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    // If user is not registered, add them
    if (!simulation.userIds.includes(userId)) {
      await Simulation.updateOne(
        { simulationId },
        { $addToSet: { userIds: userId } }
      );
    }
    
    // Update the SimulationParticipant for backward compatibility
    const participant = await SimulationParticipant.findOneAndUpdate(
      { userId, simulationId },
      { 
        $set: { mcqAttemptId },
        $setOnInsert: { userId, simulationId }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      participant
    });
  } catch (error) {
    console.error('Error updating MCQ attempt ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MCQ attempt ID: ' + error.message
    });
  }
});

// Add DSA submission ID
router.put('/participants/:userId/:simulationId/dsa', async (req, res) => {
  try {
    const { userId, simulationId } = req.params;
    const { dsaSubmissionId } = req.body;
    
    console.log('Adding DSA submission ID:', { userId, simulationId, dsaSubmissionId });
    
    if (!dsaSubmissionId) {
      return res.status(400).json({
        success: false,
        error: 'dsaSubmissionId is required'
      });
    }
    
    // Find the simulation first to ensure user is registered
    const simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    // If user is not registered, add them
    if (!simulation.userIds.includes(userId)) {
      await Simulation.updateOne(
        { simulationId },
        { $addToSet: { userIds: userId } }
      );
    }
    
    // Update the SimulationParticipant for backward compatibility
    const participant = await SimulationParticipant.findOneAndUpdate(
      { userId, simulationId },
      { 
        $addToSet: { dsaSubmissionIds: dsaSubmissionId },
        $setOnInsert: { userId, simulationId }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      participant
    });
  } catch (error) {
    console.error('Error adding DSA submission ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add DSA submission ID: ' + error.message
    });
  }
});

// Get simulation details
router.get('/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;
    
    const simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    res.json({
      success: true,
      simulation
    });
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation'
    });
  }
});

// Get all simulations
router.get('/', async (req, res) => {
  try {
    const simulations = await Simulation.find();
    
    res.json({
      success: true,
      simulations
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulations'
    });
  }
});

// Update simulation MCQ test IDs
router.put('/:simulationId/mcq-tests', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { mcqTests } = req.body;
    
    if (!Array.isArray(mcqTests)) {
      return res.status(400).json({
        success: false,
        error: 'mcqTests must be an array'
      });
    }
    
    const simulation = await Simulation.findOneAndUpdate(
      { simulationId },
      { $set: { 'testsId.mcqTests': mcqTests } },
      { new: true }
    );
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    res.json({
      success: true,
      simulation
    });
  } catch (error) {
    console.error('Error updating simulation MCQ tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update simulation MCQ tests'
    });
  }
});

// Update simulation DSA test IDs
router.put('/:simulationId/dsa-tests', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { dsaTests } = req.body;
    
    if (!Array.isArray(dsaTests)) {
      return res.status(400).json({
        success: false,
        error: 'dsaTests must be an array'
      });
    }
    
    const simulation = await Simulation.findOneAndUpdate(
      { simulationId },
      { $set: { 'testsId.dsaTests': dsaTests } },
      { new: true }
    );
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }
    
    res.json({
      success: true,
      simulation
    });
  } catch (error) {
    console.error('Error updating simulation DSA tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update simulation DSA tests'
    });
  }
});

module.exports = router;