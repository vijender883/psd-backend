// File: routes/code-execution.js
// to edit the test time goto line 23 or search for scheduledStartTime

const express = require('express');
const { executeCode } = require('../services/codeExecutor');
const router = express.Router();
const Submission = require('../models/Submission');
const { problems, getProblemList } = require('../models/problems');
const Simulation = require('../models/Simulation');
const Leaderboard = require('../models/Leaderboard');
const ActiveDSA = require('../models/ActiveDSA');
const axios = require('axios');

const problemsCache = new Map();
const CACHE_TTL = 3600000;

const testConfigurations = {};

function initializeTestConfig(simulationId) {
  let configChanged = false;

  if (!testConfigurations[simulationId]) {
    testConfigurations[simulationId] = {
      // Set start time to now so the test is always active for development
      scheduledStartTime: new Date().toISOString(),
      testDuration: 60 * 60 * 24, // 24 hours duration for testing
      allowLateEntry: false
    };
    configChanged = true;
  }

  // Schedule visibility update if this is the first time loading the config
  if (configChanged) {
    scheduleSubmissionVisibility(simulationId);
  }

  return testConfigurations[simulationId];
}

async function areResultsAvailable(simulationId) {
  try {
    const simulation = await Simulation.findOne({ simulationId });

    if (!simulation) {
      return true; // Default to available if simulation not found
    }

    return simulation.areResultsAvailable();
  } catch (error) {
    console.error('Error checking results availability:', error);
    return true; // Default to available in case of error
  }
}

function scheduleSubmissionVisibility(simulationId) {
  // Initialize the test config if not already done
  initializeTestConfig(simulationId);

  const config = testConfigurations[simulationId];
  const startTime = new Date(config.scheduledStartTime);
  const endTime = new Date(startTime.getTime() + (config.testDuration + 10) * 1000); // Add 10 seconds buffer

  const now = new Date();

  // If end time is in the future, schedule the update
  if (endTime > now) {
    const timeUntilEnd = endTime.getTime() - now.getTime();

    console.log(`Scheduling visibility update for simulation ${simulationId} in ${timeUntilEnd / 1000} seconds`);

    setTimeout(async () => {
      try {
        // Update all submissions for this simulation to show=true
        await Submission.updateMany(
          { show: false },
          { show: true }
        );

        console.log(`Automatically updated submission visibility for simulation ${simulationId}`);
      } catch (error) {
        console.error(`Error updating submission visibility for simulation ${simulationId}:`, error);
      }
    }, timeUntilEnd);
  } else {
    // Test has already ended, update submissions immediately
    (async () => {
      try {
        await Submission.updateMany(
          { show: false },
          { show: true }
        );

        console.log(`Immediately updated submission visibility for simulation ${simulationId} (past end time)`);
      } catch (error) {
        console.error(`Error updating submission visibility for simulation ${simulationId}:`, error);
      }
    })();
  }
}

// Get all problems
router.get('/problems', (req, res) => {
  const cacheKey = 'all_problems';
  if (problemsCache.has(cacheKey)) {
    return res.json(problemsCache.get(cacheKey));
  }

  const problemList = getProblemList();
  problemsCache.set(cacheKey, problemList);
  setTimeout(() => problemsCache.delete(cacheKey), CACHE_TTL);

  res.json(problemList);
});

// Get a specific submission
router.get('/submission/results/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    const question = problems[submission.problemId];

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if the submission is allowed to be shown
    if (!submission.show) {
      return res.status(403).json({
        success: false,
        error: 'Results are not yet available for this submission'
      });
    }

    console.log('Submission:', submission);

    res.json({
      problemId: submission.problemId,
      title: question.title,
      description: question.description,
      inputFormat: question.inputFormat,
      outputFormat: question.outputFormat,
      example: question.example,
      success: true,
      results: submission.results,
      createdAt: submission.createdAt,
      executionTime: submission.executionTime,
      solution: question.solution,
      code: submission.code,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      language: submission.language || 'java'
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submission',
        stack: error.message
      }
    });
  }
});

// Check submission status endpoint
router.post('/simulation/problem', async (req, res) => {
  try {
    const { simulationId, problemId, userId } = req.body;

    // First try to find problem in global problems list (fallback)
    let problem = problems[problemId];

    // If not found, try to find in simulation specific questions if needed
    // (This part depends on if we strictly want simulation-scoped problems)

    if (!problem) {
      // Try fetching from simulation DB object if not in static list
      const simulation = await Simulation.findOne({ simulationId });
      if (simulation) {
        const dsaQ = simulation.getDSAQuestionById(problemId);
        if (dsaQ) problem = dsaQ.toObject();
      }
    }

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Check submission status if userId provided
    let isSubmitted = false;
    let submittedCode = null;
    let submissionId = null;

    if (userId) {
      const submission = await Submission.findOne({
        userId: userId.trim(),
        problemId: problemId
      });

      if (submission && submission.isSubmitted) {
        isSubmitted = true;
        submittedCode = submission.code;
        submissionId = submission._id;
      }
    }

    // Retrieve problem details
    const { testCases, templates, solution, ...problemData } = problem;

    // Determine template to send (default to Python or first available)
    const functionTemplate = problem.templates?.python || problem.templates?.java || Object.values(problem.templates || {})[0] || "";

    res.json({
      success: true,
      problem: {
        ...problemData,
        functionTemplate
      },
      code: submittedCode,
      isSubmitted,
      submissionId
    });

  } catch (error) {
    console.error('Error fetching problem details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem details'
    });
  }
});

router.get('/check-submission/:userId/:problemId', async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    // Validate inputs
    if (!userId || !problemId) {
      return res.status(400).json({
        success: false,
        error: 'UserId and problemId are required'
      });
    }

    // Find submission for this user and problem
    const submission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    // ADD THIS NULL CHECK
    if (!submission) {
      // No submission found
      return res.json({
        success: true,
        hasSubmitted: false
      });
    }

    if (submission.isSubmitted) {
      // User has already submitted
      return res.json({
        success: true,
        hasSubmitted: true,
        submissionId: submission._id,
        code: submission.code,
        pseudocode: submission.pseudocode || '',
        show: submission.show,
        createdAt: submission.createdAt
      });
    } else {
      // Submission exists but not yet submitted (draft)
      return res.json({
        success: true,
        hasSubmitted: false
      });
    }
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check submission status',
        stack: error.message
      }
    });
  }
});

router.get('/submission/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if the submission is allowed to be shown
    if (!submission.show) {
      return res.status(403).json({
        success: false,
        error: 'Results are not yet available for this submission'
      });
    }

    res.json({
      success: true,
      results: submission.results,
      executionTime: submission.executionTime,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      language: submission.language || 'java'
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submission',
        stack: error.message
      }
    });
  }
});

// Check submission status
router.get('/submission-status/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Get the simulationId from query params or default to "1"
    const simulationId = req.query.simulationId || "1";

    // Check if results are available for this simulation
    const resultsAvailable = await areResultsAvailable(simulationId);

    // Override the show status based on simulation settings
    const showResults = submission.show && resultsAvailable;

    res.json({
      id: submission._id,
      show: showResults, // Combine DB status with simulation availability
      createdAt: submission.createdAt,
      language: submission.language || 'java',
      resultsAvailable // Include explicit flag about availability
    });
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check submission status',
        stack: error.message
      }
    });
  }
});

// Run code (test run, not submission)
router.post('/run', async (req, res) => {
  const { code, problemId, language = 'python', timeComplexity, spaceComplexity } = req.body;

  // Input validation
  if (!code || !problemId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields',
        stack: 'Code and problemId are required'
      }
    });
  }

  const problem = problems[problemId];
  if (!problem) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Problem not found',
        stack: `No problem found with ID: ${problemId}`
      }
    });
  }

  try {
    // Take only first two test cases
    const limitedTestCases = problem.testCases.slice(0, 2);

    // Execute code against limited test cases, passing the language parameter
    const result = await executeCode(code, limitedTestCases, language, problemId);

    if (!result.success) {
      return res.json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Execution failed',
        stack: error.message
      }
    });
  }
});


// Route alias for frontend compatibility
router.post('/simulations/run', async (req, res) => {
  // Use the same logic as /run endpoint
  const { code, problemId, language = 'python', timeComplexity, spaceComplexity } = req.body;

  // Input validation
  if (!code || !problemId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields',
        stack: 'Code and problemId are required'
      }
    });
  }

  const problem = problems[problemId];
  if (!problem) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Problem not found',
        stack: `No problem found with ID: ${problemId}`
      }
    });
  }

  try {
    // Take only first two test cases
    const limitedTestCases = problem.testCases.slice(0, 2);

    // Execute code against limited test cases, passing the language parameter
    const result = await executeCode(code, limitedTestCases, language, problemId);

    if (!result.success) {
      return res.json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Execution failed',
        stack: error.message
      }
    });
  }
});

// Get a specific problem with language parameter
router.get('/problems/:id', (req, res) => {
  const { id } = req.params;
  const { language = 'python' } = req.query;
  const cacheKey = `problem_${id}_${language}`;

  if (problemsCache.has(cacheKey)) {
    return res.json(problemsCache.get(cacheKey));
  }

  const problem = problems[id];
  if (!problem) {
    return res.status(404).json({
      success: false,
      error: 'Problem not found'
    });
  }

  const { testCases, templates, ...problemData } = problem;
  const functionTemplate = templates[language] || templates.java;
  const responseData = {
    ...problemData,
    functionTemplate,
    showSolution: !!problem.solution
  };

  problemsCache.set(cacheKey, responseData);
  setTimeout(() => problemsCache.delete(cacheKey), CACHE_TTL);

  res.json(responseData);
});

// Get submissions with optional username filter
router.get('/submissions', async (req, res) => {
  try {
    const { username } = req.query;
    const query = username ? { username } : {};

    const submissions = await Submission.find(query)
      .sort({ score: -1, createdAt: -1 })
      .select('username problemId score passedTests totalTests executionTime createdAt show language');

    console.log('Fetching submissions with query:', query);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submissions',
        stack: error.message
      }
    });
  }
});

// Analyze and submit code - simplified without complexity analysis
router.post('/analyze', async (req, res) => {
  const { code, pseudocode, timeComplexity, spaceComplexity, problemId, username, userId, language = 'python' } = req.body;

  console.log(`Received submission request from ${username} (ID: ${userId}) for problem ${problemId}`);

  const problem = problems[problemId];
  if (!problem) {
    console.log(`Problem ${problemId} not found`);
    return res.status(404).json({
      success: false,
      error: 'Problem not found'
    });
  }

  try {
    // First, check if this user has already submitted for this problem
    const existingSubmission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    if (existingSubmission) {
      // User has already submitted for this problem
      console.log(`User ${username} (ID: ${userId}) has already submitted for problem ${problemId}, submission ID: ${existingSubmission._id}`);
      return res.json({
        success: true,
        message: "You have already submitted a solution for this problem",
        submissionId: existingSubmission._id,
        alreadySubmitted: true
      });
    }

    console.log(`Creating new submission record for ${username} (ID: ${userId}) on problem ${problemId}`);

    // Create a submission record immediately without waiting for execution
    const submission = new Submission({
      username,
      userId,
      problemId,
      code,
      pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : '',
      timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : (existingSubmission.timeComplexity || ''),
      spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : (existingSubmission.spaceComplexity || ''),
      timeTaken: req.body.timeTaken || 0,
      language,
      executionTime: 0,
      score: 0,
      passedTests: 0,
      totalTests: problem.testCases.length,
      results: [],
      show: false,
      processingComplete: false,
      isSubmitted: true
    });

    await submission.save();
    console.log(`Submission record created with ID: ${submission._id}`);

    // Start processing in the background without waiting for it to complete
    console.log(`Initiating background processing for submission ${submission._id}`);
    processSubmissionAsync(submission._id, code, problem, language)
      .catch(err => console.error(`Background processing error for submission ${submission._id}:`, err));

    // Return success immediately
    console.log(`Returning success response to client for submission ${submission._id}`);
    res.json({
      success: true,
      message: "Submission received successfully",
      submissionId: submission._id,
      pendingApproval: true
    });

  } catch (error) {
    // Check if this is a duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      console.log(`Duplicate submission detected from ${username} for problem ${problemId}`);
      // This means the user tried to submit the same problem twice
      try {
        // Find the existing submission
        const existingSubmission = await Submission.findOne({
          username: username.trim(),
          problemId: problemId
        });

        if (existingSubmission) {
          console.log(`Found existing submission: ${existingSubmission._id}`);
          return res.json({
            success: true,
            message: "You have already submitted a solution for this problem",
            submissionId: existingSubmission._id,
            alreadySubmitted: true
          });
        }
      } catch (findError) {
        console.error('Error finding existing submission:', findError);
      }
    }

    console.error('Submission processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Submission processing failed',
        stack: error.message
      }
    });
  }
});

// Route alias for submission compatibility
router.post('/simulations/submit-problem', async (req, res) => {
  // Use the same logic as /analyze endpoint
  const { code, pseudocode, timeComplexity, spaceComplexity, problemId, username, userId, language = 'python' } = req.body;

  console.log(`Received submission request (legacy route) from ${username} (ID: ${userId}) for problem ${problemId}`);

  const problem = problems[problemId];
  if (!problem) {
    console.log(`Problem ${problemId} not found`);
    return res.status(404).json({
      success: false,
      error: 'Problem not found'
    });
  }

  try {
    // First, check if this user has already submitted for this problem
    const existingSubmission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    if (existingSubmission) {
      // User has already submitted for this problem
      console.log(`User ${username} (ID: ${userId}) has already submitted for problem ${problemId}, submission ID: ${existingSubmission._id}`);
      return res.json({
        success: true,
        message: "You have already submitted a solution for this problem",
        submissionId: existingSubmission._id,
        alreadySubmitted: true
      });
    }

    console.log(`Creating new submission record for ${username} (ID: ${userId}) on problem ${problemId}`);

    // Create a submission record immediately without waiting for execution
    const submission = new Submission({
      username,
      userId,
      problemId,
      code,
      pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : '',
      timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : (existingSubmission?.timeComplexity || ''),
      spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : (existingSubmission?.spaceComplexity || ''),
      timeTaken: req.body.timeTaken || 0,
      language,
      executionTime: 0,
      score: 0,
      passedTests: 0,
      totalTests: problem.testCases.length,
      results: [],
      show: false,
      processingComplete: false,
      isSubmitted: true
    });

    await submission.save();
    console.log(`Submission record created with ID: ${submission._id}`);

    // Start processing in the background without waiting for it to complete
    console.log(`Initiating background processing for submission ${submission._id}`);
    processSubmissionAsync(submission._id, code, problem, language)
      .catch(err => console.error(`Background processing error for submission ${submission._id}:`, err));

    // Return success immediately
    console.log(`Returning success response to client for submission ${submission._id}`);
    res.json({
      success: true,
      message: "Submission received successfully",
      submissionId: submission._id,
      pendingApproval: true
    });

  } catch (error) {
    // Check if this is a duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      console.log(`Duplicate submission detected from ${username} for problem ${problemId}`);
      try {
        const existingSubmission = await Submission.findOne({
          username: username.trim(),
          problemId: problemId
        });

        if (existingSubmission) {
          return res.json({
            success: true,
            message: "You have already submitted a solution for this problem",
            submissionId: existingSubmission._id,
            alreadySubmitted: true
          });
        }
      } catch (findError) {
        console.error('Error finding existing submission:', findError);
      }
    }

    console.error('Submission processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Submission processing failed',
        stack: error.message
      }
    });
  }
});


router.get('/debug/submission/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // For debugging, always return detailed data regardless of 'show' status
    console.log(`Debug request for submission ${req.params.id}`);
    console.log(`Processing status: ${submission.processingComplete ? 'Complete' : 'In Progress'}`);

    res.json({
      id: submission._id,
      processingComplete: submission.processingComplete,
      username: submission.username,
      problemId: submission.problemId,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      show: submission.show,
      error: submission.error,
      createdAt: submission.createdAt
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submission debug info',
        stack: error.message
      }
    });
  }
});

async function processSubmissionAsync(submissionId, code, problem, language) {
  try {
    console.log(`Starting background processing for submission ${submissionId}`);
    console.log(`Language: ${language}`);

    // Log problem details
    console.log(`Processing problem: ${problem.id} - ${problem.title}`);

    // Execute code
    const result = await executeCode(code, problem.testCases, language, problem.id);
    console.log(`Code execution completed with ${result.results ? result.results.filter(r => r.passed).length : 0}/${result.results ? result.results.length : 0} tests passed`);

    // Calculate metrics
    const totalTests = result.results ? result.results.length : 0;
    const passedTests = result.results ? result.results.filter(r => r.passed).length : 0;
    const averageExecutionTime = totalTests > 0
      ? result.results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests
      : 0;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Update the submission with results
    console.log(`Updating submission ${submissionId} with execution results`);
    await Submission.findByIdAndUpdate(submissionId, {
      executionTime: averageExecutionTime,
      score,
      passedTests,
      results: result.results || [],
      processingComplete: true
    });

    console.log(`Background processing completed for submission ${submissionId}`);
  } catch (error) {
    console.error(`Background processing failed for submission ${submissionId}:`, error);

    // Update submission to mark processing as complete, even with error
    try {
      await Submission.findByIdAndUpdate(submissionId, {
        processingComplete: true,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      console.log(`Updated submission ${submissionId} with error information`);
    } catch (updateError) {
      console.error(`Failed to update submission ${submissionId} after processing error:`, updateError);
    }
  }
}

router.get('/submission/processing-status/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      id: submission._id,
      processingComplete: submission.processingComplete,
      show: submission.show
    });

  } catch (error) {
    console.error('Error checking processing status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check processing status',
        stack: error.message
      }
    });
  }
});

router.get('/test-config/:simulationId', async (req, res) => {
  const { simulationId } = req.params;

  try {
    // Initialize if not exists and schedule visibility update
    const config = initializeTestConfig(simulationId);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching test configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test configuration'
    });
  }
});

// Admin route to update submission visibility
router.put('/admin/submission/:id', async (req, res) => {
  const { show } = req.body;

  if (typeof show !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Show parameter must be a boolean'
    });
  }

  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    submission.show = show;
    await submission.save();

    res.json({
      success: true,
      message: `Submission ${show ? 'approved' : 'hidden'} successfully`,
      id: submission._id,
      show: submission.show
    });

  } catch (error) {
    console.error('Error updating submission visibility:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update submission visibility',
        stack: error.message
      }
    });
  }
});

// Add this endpoint to your code-execution.js file
router.get('/leaderboard/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;

    // Get all submissions for this problem - only the ones marked as 'show: true'
    const submissions = await Submission.find(
      { problemId, processingComplete: true, show: true },
      'userId username score passedTests totalTests createdAt'
    ).sort({ passedTests: -1, createdAt: 1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch leaderboard data',
        stack: error.message
      }
    });
  }
});

// Get problems for a specific simulation - FIXED AND CONSOLIDATED
router.get('/simulation/:simulationId/problems', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const simulation = await Simulation.findOne({ simulationId });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Get unique problem IDs from both sources
    const problemIdsSet = new Set();

    // 1. From dsa_questions (full objects)
    if (simulation.dsa_questions && simulation.dsa_questions.length > 0) {
      simulation.dsa_questions.forEach(q => problemIdsSet.add(q.id));
    }

    // 2. From testsId.dsaTests (legacy IDs)
    if (simulation.testsId && simulation.testsId.dsaTests && simulation.testsId.dsaTests.length > 0) {
      simulation.testsId.dsaTests.forEach(id => problemIdsSet.add(id));
    }

    // 3. From ActiveDSA (scheduled problems for this simulation)
    const activeProblems = await ActiveDSA.find({ simulationId, isActive: true });
    activeProblems.forEach(p => problemIdsSet.add(p.problemId));



    res.json({
      success: true,
      simulationId,
      problemIds: Array.from(problemIdsSet)
    });
  } catch (error) {
    console.error('Error fetching simulation problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation problems'
    });
  }
});

// Route alias for frontend compatibility
router.get('/simulation-time/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;

    // Initialize if not exists and schedule visibility update
    const config = initializeTestConfig(simulationId);

    res.json({
      success: true,
      data: {
        scheduled_start_time: config.scheduledStartTime
      }
    });

  } catch (error) {
    console.error('Error fetching scheduled start time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled start time'
    });
  }
});

router.get('/scheduledStartTime/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;

    // Find the simulation by simulationId
    const simulation = await Simulation.findOne({ simulationId });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Return the scheduled start time
    res.json({
      success: true,
      data: {
        simulationId: simulation.simulationId,
        scheduled_start_time: simulation.scheduled_start_time,
        title: simulation.title,
        description: simulation.description
      }
    });

  } catch (error) {
    console.error('Error fetching scheduled start time:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch scheduled start time',
        stack: error.message
      }
    });
  }
});


// Get a specific problem from simulation with language parameter
router.get('/simulation/:simulationId/problems/:problemId', async (req, res) => {
  try {
    const { simulationId, problemId } = req.params;
    const { language = 'python' } = req.query;
    const cacheKey = `simulation_${simulationId}_problem_${problemId}_${language}`;

    // Check cache first
    if (problemsCache.has(cacheKey)) {
      return res.json(problemsCache.get(cacheKey));
    }

    // Find the simulation
    const simulation = await Simulation.findOne({ simulationId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Find the specific DSA question within the simulation
    const problem = simulation.getDSAQuestionById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found in simulation'
      });
    }

    // Prepare the response data similar to the original /problems/:id endpoint
    const { testCases, templates, ...problemData } = problem.toObject();

    // Get the appropriate template for the language
    const functionTemplate = (templates && templates[language]) ||
      (templates && templates.python) ||
      '';

    const responseData = {
      ...problemData,
      functionTemplate,
      showSolution: !!problem.solution
    };

    // Cache the response
    problemsCache.set(cacheKey, responseData);
    setTimeout(() => problemsCache.delete(cacheKey), CACHE_TTL);

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching simulation problem:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch simulation problem',
        stack: error.message
      }
    });
  }
});


router.post('/simulations/:simulationId/:userId/:username/run', async (req, res) => {
  const { simulationId, userId, username } = req.params;
  const { code, pseudocode, timeComplexity, spaceComplexity, problemId, language = 'python' } = req.body;

  // Input validation
  if (!code || !problemId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields',
        stack: 'Code and problemId are required'
      }
    });
  }

  try {
    // Find the simulation
    const simulation = await Simulation.findOne({ simulationId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Simulation not found',
          stack: `No simulation found with ID: ${simulationId}`
        }
      });
    }

    // Find the specific problem within the simulation's DSA questions
    const problem = simulation.getDSAQuestionById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Problem not found in simulation',
          stack: `No problem found with ID: ${problemId} in simulation ${simulationId}`
        }
      });
    }

    // Check if existing submission exists for this user and problem
    let existingSubmission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    if (existingSubmission) {
      // Update existing submission with new code, pseudocode and timestamp
      existingSubmission = await Submission.findByIdAndUpdate(existingSubmission._id, {
        code: code,
        pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : (existingSubmission.pseudocode || ''),
        timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : (existingSubmission.timeComplexity || ''),
        spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : (existingSubmission.spaceComplexity || ''),
        language: language,
        username: username,
        createdAt: new Date()
      }, { new: true });
      console.log(`Updated existing submission ${existingSubmission._id} for user ${userId}`);
    } else {
      // Create new submission with isSubmitted: false
      existingSubmission = new Submission({
        username,
        userId,
        problemId,
        simulationId,
        code,
        pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : '',
        timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : '',
        spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : '',
        language,
        executionTime: 0,
        score: 0,
        passedTests: 0,
        totalTests: problem.testCases.length,
        results: [],
        show: false,
        processingComplete: false,
        isSubmitted: false
      });
      await existingSubmission.save();
      console.log(`Created new draft submission ${existingSubmission._id} for user ${userId}`);
    }

    // Take only first two test cases (same logic as original /run endpoint)
    const limitedTestCases = problem.testCases.slice(0, 2);

    // Execute code against limited test cases, passing the language parameter
    const result = await executeCode(code, limitedTestCases, language, problemId);

    if (!result.success) {
      return res.json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Simulation code execution error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Execution failed',
        stack: error.message
      }
    });
  }
});



// Updated helper function for processing simulation submissions with leaderboard integration
async function processSimulationSubmissionAsync(submissionId, code, problem, language, simulationId, userId, username, pseudocode) {
  try {
    console.log(`Starting background processing for simulation submission ${submissionId}`);
    console.log(`Language: ${language}`);

    // Log problem details
    console.log(`Processing simulation problem: ${problem.id} - ${problem.title}`);

    // Execute code using the problem's test cases
    const result = await executeCode(code, problem.testCases, language, problem.id);
    console.log(`Code execution completed with ${result.results ? result.results.filter(r => r.passed).length : 0}/${result.results ? result.results.length : 0} tests passed`);

    // Calculate metrics
    const totalTests = result.results ? result.results.length : 0;
    const passedTests = result.results ? result.results.filter(r => r.passed).length : 0;
    const averageExecutionTime = totalTests > 0
      ? result.results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests
      : 0;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Call Gemini Review API
    let geminiReview = '';
    try {
      console.log(`Calling Gemini review API for submission ${submissionId}`);
      const geminiResponse = await axios.post('http://localhost:8002/geminireview', {
        userId: userId,
        problemId: problem.id,
        code: code,
        pseudocode: pseudocode || '',
        language: language
      }, {
        timeout: 30000 // 30 second timeout
      });

      if (geminiResponse.data && geminiResponse.data.review) {
        geminiReview = geminiResponse.data.review;
        console.log(`✅ Successfully received Gemini review for submission ${submissionId}`);
      }
    } catch (geminiError) {
      console.error(`❌ Failed to get Gemini review for submission ${submissionId}:`, geminiError.message);
      geminiReview = 'Review could not be generated at this time.';
    }

    // Update the submission with results
    console.log(`Updating simulation submission ${submissionId} with execution results`);
    await Submission.findByIdAndUpdate(submissionId, {
      executionTime: averageExecutionTime,
      score,
      passedTests,
      results: result.results || [],
      geminiReview: geminiReview,
      processingComplete: true
    });

    // Add to leaderboard using the new model with username
    try {
      const submittedTime = new Date();
      await Leaderboard.add_to_leaderboard(simulationId, userId, username, score, submittedTime);
      console.log(`✅ Successfully updated leaderboard for user ${userId} (${username}) in simulation ${simulationId} with score ${score}`);
    } catch (leaderboardError) {
      console.error(`❌ Failed to update leaderboard for user ${userId} (${username}) in simulation ${simulationId}:`, leaderboardError);
      // Don't throw error here as submission processing was successful
    }

    console.log(`Background processing completed for simulation submission ${submissionId}`);
  } catch (error) {
    console.error(`Background processing failed for simulation submission ${submissionId}:`, error);

    // Update submission to mark processing as complete, even with error
    try {
      await Submission.findByIdAndUpdate(submissionId, {
        processingComplete: true,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      console.log(`Updated simulation submission ${submissionId} with error information`);
    } catch (updateError) {
      console.error(`Failed to update simulation submission ${submissionId} after processing error:`, updateError);
    }
  }
}


//Using this endpoint for simulation submissions
// Updated /simulations/:simulationId/analyze endpoint
router.post('/simulations/:simulationId/analyze', async (req, res) => {
  const { simulationId } = req.params;
  const { code, pseudocode, timeComplexity, spaceComplexity, problemId, username, userId, language = 'python' } = req.body;

  console.log(`Received submission request from ${username} (ID: ${userId}) for problem ${problemId} in simulation ${simulationId}`);

  try {
    // Find the simulation
    const simulation = await Simulation.findOne({ simulationId });
    if (!simulation) {
      console.log(`Simulation ${simulationId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Find the specific problem within the simulation's DSA questions
    const problem = simulation.getDSAQuestionById(problemId);
    if (!problem) {
      console.log(`Problem ${problemId} not found in simulation ${simulationId}`);
      return res.status(404).json({
        success: false,
        error: 'Problem not found in simulation'
      });
    }

    // Check if this user has an existing submission for this problem in this simulation
    let existingSubmission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    if (existingSubmission) {
      // Check if already submitted
      if (existingSubmission.isSubmitted) {
        console.log(`User ${username} (ID: ${userId}) has already submitted for problem ${problemId} in simulation ${simulationId}, submission ID: ${existingSubmission._id}`);
        return res.json({
          success: true,
          message: "You have already submitted a solution for this problem",
          submissionId: existingSubmission._id,
          alreadySubmitted: true
        });
      } else {
        // Update existing draft submission and mark as submitted
        existingSubmission = await Submission.findByIdAndUpdate(existingSubmission._id, {
          code: code,
          pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : (existingSubmission.pseudocode || ''),
          timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : (existingSubmission.timeComplexity || ''),
          spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : (existingSubmission.spaceComplexity || ''),
          language: language,
          username: username,
          isSubmitted: true,
          createdAt: new Date(),
          // Reset processing fields for new submission
          executionTime: 0,
          score: 0,
          passedTests: 0,
          totalTests: problem.testCases.length,
          results: [],
          processingComplete: false,
          error: undefined
        }, { new: true });

        console.log(`Updated existing draft submission ${existingSubmission._id} and marked as submitted for user ${userId}`);

        // Start processing in the background without waiting for it to complete
        console.log(`Initiating background processing for submission ${existingSubmission._id} in simulation ${simulationId}`);
        processSimulationSubmissionAsync(existingSubmission._id, code, problem, language, simulationId, userId, username)
          .catch(err => console.error(`Background processing error for submission ${existingSubmission._id} in simulation ${simulationId}:`, err));

        return res.json({
          success: true,
          message: "Submission received successfully",
          submissionId: existingSubmission._id,
          pendingApproval: true
        });
      }
    }
    console.log(`Creating new submission record for ${username} (ID: ${userId}) on problem ${problemId} in simulation ${simulationId}`);

    // Create a submission record immediately without waiting for execution
    existingSubmission = new Submission({
      username,
      userId,
      problemId,
      simulationId,
      code,
      pseudocode: (pseudocode !== undefined && pseudocode !== null) ? pseudocode : '',
      timeComplexity: (timeComplexity !== undefined && timeComplexity !== null) ? timeComplexity : '',
      spaceComplexity: (spaceComplexity !== undefined && spaceComplexity !== null) ? spaceComplexity : '',
      language,
      executionTime: 0,
      score: 0,
      passedTests: 0,
      totalTests: problem.testCases.length,
      results: [],
      show: false,
      processingComplete: false,
      isSubmitted: true
    });
    await existingSubmission.save();
    console.log(`Submission record created with ID: ${existingSubmission._id} for simulation ${simulationId}`);

    // Start processing in the background without waiting for it to complete
    console.log(`Initiating background processing for submission ${existingSubmission._id} in simulation ${simulationId}`);
    processSimulationSubmissionAsync(existingSubmission._id, code, problem, language, simulationId, userId, username)
      .catch(err => console.error(`Background processing error for submission ${existingSubmission._id} in simulation ${simulationId}:`, err));

    // Return success immediately
    console.log(`Returning success response to client for submission ${existingSubmission._id} in simulation ${simulationId}`);
    res.json({
      success: true,
      message: "Submission received successfully",
      submissionId: existingSubmission._id,
      pendingApproval: true
    });

  } catch (error) {
    // Check if this is a duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      console.log(`Duplicate submission detected from ${username} for problem ${problemId} in simulation ${simulationId}`);
      try {
        const existingSubmission = await Submission.findOne({
          username: username.trim(),
          problemId: problemId
        });

        if (existingSubmission) {
          console.log(`Found existing submission: ${existingSubmission._id} in simulation ${simulationId}`);
          return res.json({
            success: true,
            message: "You have already submitted a solution for this problem",
            submissionId: existingSubmission._id,
            alreadySubmitted: true
          });
        }
      } catch (findError) {
        console.error('Error finding existing submission:', findError);
      }
    }

    console.error(`Submission processing error for simulation ${simulationId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Submission processing failed',
        stack: error.message
      }
    });
  }
});

// NOTE: Leaderboard endpoint moved to /api/leaderboard/simulations/:simulationId/leaderboard
// This duplicate route has been removed to avoid conflicts




router.get('/viewresults/:userId/:problemId', async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    // Validate inputs
    if (!userId || !problemId) {
      return res.status(400).json({
        success: false,
        error: 'UserId and problemId are required'
      });
    }

    console.log(`Fetching results for user ${userId} and problem ${problemId}`);

    // Find submission for this user and problem
    const submission = await Submission.findOne({
      userId: userId.trim(),
      problemId: problemId
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No submission found for this user and problem'
      });
    }

    // Check if processing is complete
    if (!submission.processingComplete) {
      return res.status(202).json({
        success: false,
        error: 'Submission is still being processed',
        processingComplete: false
      });
    }

    // Return the requested fields
    res.json({
      success: true,
      data: {
        userId: submission.userId,
        problemId: submission.problemId,
        score: submission.score,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        results: submission.results
      }
    });

  } catch (error) {
    console.error('Error fetching submission results:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submission results',
        stack: error.message
      }
    });
  }
});


router.get('/optimalsolution/:simulationId/:problemId', async (req, res) => {
  try {
    const { simulationId, problemId } = req.params;

    // Validate inputs
    if (!simulationId || !problemId) {
      return res.status(400).json({
        success: false,
        error: 'SimulationId and problemId are required'
      });
    }

    console.log(`Fetching optimal solution for problem ${problemId} in simulation ${simulationId}`);

    // Find the simulation
    const simulation = await Simulation.findOne({ simulationId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Find the specific DSA question within the simulation
    const problem = simulation.getDSAQuestionById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found in simulation'
      });
    }

    // Check if solution exists
    if (!problem.solution || problem.solution.trim() === '') {
      return res.status(404).json({
        success: false,
        error: 'No solution available for this problem'
      });
    }

    // Return the solution
    res.json({
      success: true,
      data: {
        simulationId: simulationId,
        problemId: problemId,
        title: problem.title,
        solution: problem.solution
      }
    });

  } catch (error) {
    console.error('Error fetching optimal solution:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch optimal solution',
        stack: error.message
      }
    });
  }
});



router.get('/simulation/viewcode/:problemid/:userid', async (req, res) => {
  try {
    const { problemid, userid } = req.params;

    // Validate inputs
    if (!userid || !problemid) {
      return res.status(400).json({
        success: false,
        error: 'UserId and problemId are required'
      });
    }

    console.log(`Fetching code for user ${userid} and problem ${problemid}`);

    // Find submission for this user and problem
    const submission = await Submission.findOne({
      userId: userid.trim(),
      problemId: problemid
    });

    if (!submission) {
      return res.json({
        success: true,
        submissionFound: false,
        message: 'No submission found for this user and problem'
      });
    }

    // Return the code and pseudocode from the submission
    res.json({
      success: true,
      submissionFound: true,
      userId: submission.userId,
      problemId: submission.problemId,
      code: submission.code,
      pseudocode: submission.pseudocode || '',
      timeComplexity: submission.timeComplexity || '',
      spaceComplexity: submission.spaceComplexity || '',
      isSubmitted: submission.isSubmitted
    });

  } catch (error) {
    console.error('Error fetching submission code:', error);
    res.status(500).json({
      success: false,
      submissionFound: false,
      error: {
        message: 'Failed to fetch submission code',
        stack: error.message
      }
    });
  }
});




module.exports = router;