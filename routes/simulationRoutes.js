// routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const Simulation = require('../models/Simulation');
const SimulationParticipant = require('../models/SimulationParticipant'); // Keep for backward compatibility
const ActiveDSA = require('../models/ActiveDSA');

// Initialize simulations
const { problems } = require('../models/problems');

const initializeSimulations = async () => {
  try {
    // Check if simulations already exist
    const count = await Simulation.countDocuments();

    if (count === 0) {
      console.log('No simulations found. Creating initial simulations...');

      // Create initial simulations if none exist
      await Simulation.create([
        {
          simulationId: "1",
          title: "Algorithmic Problem Solving",
          description: "Test your DSA skills with coding and MCQ tests",
          testsId: {
            mcqTests: [], // Will be dynamically populated
            dsaTests: ["countconsecutive", "closestvalueinrotatedarray", "twosum", "largest_element", "second_smallest_largest"]
          },
          dsa_questions: [
            problems['countconsecutive'],
            problems['closestvalueinrotatedarray'],
            problems['twosum'],
            problems['largest_element'],
            problems['second_smallest_largest']
          ].filter(Boolean),
          participationIds: [],
          // Add the new field with null default (results available immediately)
          resultsAvailableTime: null
        },
        {
          simulationId: "2",
          title: "Database Design Challenge",
          description: "Practice database schema design and SQL queries",
          testsId: {
            mcqTests: [], // Will be dynamically populated
            dsaTests: ["longestincreasing", "longestcommonprefix"]
          },
          dsa_questions: [
            problems['longestincreasing'],
            problems['longestcommonprefix']
          ].filter(Boolean),
          participationIds: [],
          // Add the new field with null default (results available immediately)
          resultsAvailableTime: null
        }
      ]);

      console.log('Simulations initialized successfully');
    } else {
      console.log(`Found ${count} existing simulations. Verifying data integrity...`);

      // Force update simulation 1 to ensure dsa_questions are populated
      const sim1 = await Simulation.findOne({ simulationId: "1" });
      if (sim1) {
        console.log("Checking Simulation 1 for missing problems...");
        let needSave = false;

        // Ensure IDs are present
        const requiredIds = ["countconsecutive", "closestvalueinrotatedarray", "twosum", "largest_element", "second_smallest_largest"];
        requiredIds.forEach(id => {
          if (!sim1.testsId.dsaTests.includes(id)) {
            sim1.testsId.dsaTests.push(id);
            needSave = true;
            console.log(`Added missing ID: ${id}`);
          }
        });

        // Aggressively sync content in dsa_questions from problems object
        // This ensures that any edits to descriptions, templates, or expected outputs in problems.js
        // are reflected in the database and UI.
        const updatedDsaQuestions = requiredIds.map(id => {
          if (problems[id]) {
            console.log(`Syncing definition for: ${id}`);
            return problems[id];
          }
          return null;
        }).filter(Boolean);

        // Check if there's any change to avoid unnecessary saves
        // Using a loose check for simulation content
        if (JSON.stringify(sim1.dsa_questions.map(q => q.id)) !== JSON.stringify(requiredIds) ||
          sim1.dsa_questions.length !== updatedDsaQuestions.length ||
          needSave) {
          sim1.dsa_questions = updatedDsaQuestions;
          needSave = true;
        } else {
          // Even if IDs match, force update if content might have changed (e.g. descriptions)
          sim1.dsa_questions = updatedDsaQuestions;
          needSave = true; // Always save when server restarts to be 100% sure sync happens
        }

        if (needSave) {
          // Explicitly mark as modified if we updated elements in the array
          sim1.markModified('dsa_questions');
          await sim1.save();
          console.log("Simulation 1 updated/synced with latest problem definitions.");
        } else {
          console.log("Simulation 1 is up to date.");
        }
      }
    }
  } catch (error) {
    console.error('Error initializing simulations:', error);
    // Log more detailed error information
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
    } else if (error.code) {
      console.error('MongoDB error code:', error.code);
    }
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
    if (simulation.participationIds.includes(userId)) {
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
      { $addToSet: { participationIds: userId } },
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
    const isRegistered = simulation.participationIds.includes(userId);

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
    if (!simulation.participationIds.includes(userId)) {
      await Simulation.updateOne(
        { simulationId },
        { $addToSet: { participationIds: userId } }
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
    if (!simulation.participationIds.includes(userId)) {
      await Simulation.updateOne(
        { simulationId },
        { $addToSet: { participationIds: userId } }
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

// Get simulation status (availability of results and leaderboard)
router.get('/:simulationId/status', async (req, res) => {
  try {
    const { simulationId } = req.params;

    const simulation = await Simulation.findOne({ simulationId });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Get current date/time
    const now = new Date();

    // Simple status check
    const resultsAvailable = simulation.areResultsAvailable();
    const timeUntilAvailable = simulation.resultsAvailableTime ?
      Math.max(0, simulation.resultsAvailableTime - now) : 0;

    res.json({
      success: true,
      data: {
        simulation,
        status: {
          resultsAvailable,
          timeUntilAvailable
        }
      }
    });
  } catch (error) {
    console.error('Error fetching simulation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation status'
    });
  }
});

router.put('/:simulationId/availability', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { resultsAvailableTime } = req.body;

    const updates = {};

    if (resultsAvailableTime !== undefined) {
      updates.resultsAvailableTime = resultsAvailableTime ? new Date(resultsAvailableTime) : null;
    }

    const simulation = await Simulation.findOneAndUpdate(
      { simulationId },
      { $set: updates },
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
    console.error('Error updating simulation availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update simulation availability'
    });
  }
});


// --- V2 Active DSA Control ---

// GET /api/simulations/v2/active-dsa/status
router.get('/v2/active-dsa/status', async (req, res) => {
  try {
    // Return ALL active challenges, sorted by availability time
    const activeData = await ActiveDSA.find({ isActive: true }).sort({ availableAt: 1 });
    res.json({
      success: true,
      activeData: activeData // Returns an array now
    });
  } catch (error) {
    console.error('[DSA] Error fetching status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch status' });
  }
});

// POST /api/simulations/v2/active-dsa/activate
router.post('/v2/active-dsa/activate', async (req, res) => {
  const { problemId, title, simulationId, duration, availableAt } = req.body;

  if (!problemId || !title || !availableAt) {
    return res.status(400).json({
      success: false,
      error: 'problemId, title, and availableAt are required'
    });
  }

  try {
    // DO NOT deactivate others. We want multiple active challenges.
    // await ActiveDSA.updateMany({ isActive: true }, { isActive: false });

    // Also clear them if you want to keep DB small, but marking as inactive is better for history
    // await ActiveDSA.deleteMany({}); 

    // Upsert: Update if exists, create if not. This prevents 500 duplicate key errors.
    const activeData = await ActiveDSA.findOneAndUpdate(
      { problemId },
      {
        title,
        simulationId: simulationId || "1",
        duration: duration || 30,
        activatedAt: new Date(),
        availableAt: new Date(availableAt),
        isActive: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('[DSA] Activated/Updated problem (scheduled):', activeData);

    res.json({
      success: true,
      message: 'Problem scheduled successfully',
      activeData: activeData
    });
  } catch (error) {
    console.error('[DSA] Error activating problem:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule problem' });
  }
});

// POST /api/simulations/v2/active-dsa/deactivate
router.post('/v2/active-dsa/deactivate', async (req, res) => {
  const { problemId } = req.body;

  try {
    if (problemId) {
      await ActiveDSA.updateMany({ problemId: problemId, isActive: true }, { isActive: false });
      console.log(`[DSA] Deactivated problem: ${problemId}`);
    } else {
      // Fallback for safety or legacy: ONLY if explicit "all" flag? 
      // For now, let's just deactivate all if no ID is passed, to match old behavior but warn.
      console.log('[DSA] No problemId provided, deactivating ALL active problems (Legacy Mode)');
      await ActiveDSA.updateMany({ isActive: true }, { isActive: false });
    }

    res.json({
      success: true,
      message: 'Problem deactivated successfully'
    });
  } catch (error) {
    console.error('[DSA] Error deactivating problem:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate problem' });
  }
});

module.exports = router;
