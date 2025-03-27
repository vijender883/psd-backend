// File: routes/code-execution.js
const express = require('express');
const { executeCode } = require('../services/codeExecutor');
const router = express.Router();
const Submission = require('../models/Submission');
const { analyzeProblemAndSolution } = require('../services/llmService');
const { problems, getProblemList } = require('../models/problems'); // Import from the new file
const Simulation = require('../models/Simulation');

const problemsCache = new Map();
const CACHE_TTL = 3600000;

const testConfigurations = {};

function initializeTestConfig(simulationId) {
  let configChanged = false;
  
  if (!testConfigurations[simulationId]) {
    testConfigurations[simulationId] = {
      scheduledStartTime: new Date('2025-03-28T13:45:00Z').toISOString(),
      testDuration: 60 * 60, // 3 minutes (changed from 60 minutes for testing)
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
    
    console.log(`Scheduling visibility update for simulation ${simulationId} in ${timeUntilEnd/1000} seconds`);
    
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
      timeComplexity: submission.timeComplexity,
      spaceComplexity: submission.spaceComplexity,
      language: submission.language || 'java',
      // Include the complexity analysis from LLM
      complexityAnalysis: submission.complexityAnalysis
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

    if (submission) {
      // User has already submitted
      return res.json({
        success: true,
        hasSubmitted: true,
        submissionId: submission._id,
        show: submission.show,
        createdAt: submission.createdAt
      });
    } else {
      // No submission found
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
      timeComplexity: submission.timeComplexity,
      spaceComplexity: submission.spaceComplexity,
      language: submission.language || 'java',
      complexityAnalysis: submission.complexityAnalysis
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
  const { code, problemId, language = 'java' } = req.body;

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
    const result = await executeCode(code, limitedTestCases, language);

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
  const { language = 'java' } = req.query;
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

// Analyze and submit code
// Modify the analyze endpoint in code-execution.js to separate submission and processing
router.post('/analyze', async (req, res) => {
  const { code, problemId, username, userId, timeComplexity, spaceComplexity, language = 'java' } = req.body;

  console.log(`[LLM] Received submission request from ${username} (ID: ${userId}) for problem ${problemId}`);
  console.log(`[LLM] Time complexity claimed: ${timeComplexity}, Space complexity claimed: ${spaceComplexity}`);
  
  const problem = problems[problemId];
  if (!problem) {
    console.log(`[LLM] Problem ${problemId} not found`);
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
      console.log(`[LLM] User ${username} (ID: ${userId}) has already submitted for problem ${problemId}, submission ID: ${existingSubmission._id}`);
      return res.json({
        success: true,
        message: "You have already submitted a solution for this problem",
        submissionId: existingSubmission._id,
        alreadySubmitted: true
      });
    }

    console.log(`[LLM] Creating new submission record for ${username} (ID: ${userId}) on problem ${problemId}`);
    
    // Create a submission record immediately without waiting for execution
    const submission = new Submission({
      username,
      userId,
      problemId,
      code,
      language,
      executionTime: 0,
      score: 0,
      passedTests: 0,
      totalTests: problem.testCases.length,
      results: [],
      timeComplexity,
      spaceComplexity,
      show: false,
      complexityAnalysis: {
        isTimeComplexityAccurate: true,
        isSpaceComplexityAccurate: true,
        actualTimeComplexity: timeComplexity,
        actualSpaceComplexity: spaceComplexity,
        explanation: "Processing"
      },
      processingComplete: false
    });

    await submission.save();
    console.log(`[LLM] Submission record created with ID: ${submission._id}`);

    // Start processing in the background without waiting for it to complete
    console.log(`[LLM] Initiating background processing for submission ${submission._id}`);
    processSubmissionAsync(submission._id, code, problem, language, timeComplexity, spaceComplexity)
      .catch(err => console.error(`[LLM] Background processing error for submission ${submission._id}:`, err));

    // Return success immediately
    console.log(`[LLM] Returning success response to client for submission ${submission._id}`);
    res.json({
      success: true,
      message: "Submission received successfully",
      submissionId: submission._id,
      pendingApproval: true
    });

  } catch (error) {
    // Check if this is a duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      console.log(`[LLM] Duplicate submission detected from ${username} for problem ${problemId}`);
      // This means the user tried to submit the same problem twice
      try {
        // Find the existing submission
        const existingSubmission = await Submission.findOne({ 
          username: username.trim(), 
          problemId: problemId 
        });
        
        if (existingSubmission) {
          console.log(`[LLM] Found existing submission: ${existingSubmission._id}`);
          return res.json({
            success: true,
            message: "You have already submitted a solution for this problem",
            submissionId: existingSubmission._id,
            alreadySubmitted: true
          });
        }
      } catch (findError) {
        console.error('[LLM] Error finding existing submission:', findError);
      }
    }
    
    console.error('[LLM] Submission processing error:', error);
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
    console.log(`[LLM] Debug request for submission ${req.params.id}`);
    console.log(`[LLM] Processing status: ${submission.processingComplete ? 'Complete' : 'In Progress'}`);
    
    if (submission.complexityAnalysis) {
      console.log(`[LLM] Time complexity accurate: ${submission.complexityAnalysis.isTimeComplexityAccurate}`);
      console.log(`[LLM] Space complexity accurate: ${submission.complexityAnalysis.isSpaceComplexityAccurate}`);
      console.log(`[LLM] Actual time complexity: ${submission.complexityAnalysis.actualTimeComplexity}`);
      console.log(`[LLM] Actual space complexity: ${submission.complexityAnalysis.actualSpaceComplexity}`);
    }

    res.json({
      id: submission._id,
      processingComplete: submission.processingComplete,
      username: submission.username,
      problemId: submission.problemId,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      show: submission.show,
      complexityAnalysis: submission.complexityAnalysis,
      error: submission.error,
      createdAt: submission.createdAt
    });

  } catch (error) {
    console.error('[LLM] Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch submission debug info',
        stack: error.message
      }
    });
  }
});

async function processSubmissionAsync(submissionId, code, problem, language, timeComplexity, spaceComplexity) {
  try {
    console.log(`[LLM] Starting background processing for submission ${submissionId}`);
    console.log(`[LLM] User claimed time complexity: ${timeComplexity}`);
    console.log(`[LLM] User claimed space complexity: ${spaceComplexity}`);
    console.log(`[LLM] Language: ${language}`);
    
    // Log problem details
    console.log(`[LLM] Processing problem: ${problem.id} - ${problem.title}`);
    
    // Execute code
    const result = await executeCode(code, problem.testCases, language);
    console.log(`[LLM] Code execution completed with ${result.results ? result.results.filter(r => r.passed).length : 0}/${result.results ? result.results.length : 0} tests passed`);
    
    // Log that we're starting LLM analysis
    console.log(`[LLM] Starting code analysis with LLM for submission ${submissionId}`);
    console.time(`[LLM] Analysis time for ${submissionId}`);
    
    // Analyze with LLM
    const analysis = await analyzeProblemAndSolution(
      problem,
      code,
      timeComplexity,
      spaceComplexity,
      language
    );
    
    console.timeEnd(`[LLM] Analysis time for ${submissionId}`);
    
    // Log LLM analysis results
    console.log(`[LLM] Analysis results for submission ${submissionId}:`);
    console.log(`[LLM] - Time complexity accurate: ${analysis.isTimeComplexityAccurate}`);
    console.log(`[LLM] - Space complexity accurate: ${analysis.isSpaceComplexityAccurate}`);
    console.log(`[LLM] - Actual time complexity: ${analysis.actualTimeComplexity}`);
    console.log(`[LLM] - Actual space complexity: ${analysis.actualSpaceComplexity}`);
    console.log(`[LLM] - Explanation: ${analysis.explanation.substring(0, 100)}...`);
    console.log(`[LLM] - Has improvement suggestions: ${!!analysis.improvement}`);
    console.log(`[LLM] - Has optimized solution: ${!!analysis.optimizedSolution}`);
    
    // Calculate metrics
    const totalTests = result.results ? result.results.length : 0;
    const passedTests = result.results ? result.results.filter(r => r.passed).length : 0;
    const averageExecutionTime = totalTests > 0 
      ? result.results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests 
      : 0;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Update the submission with results
    console.log(`[LLM] Updating submission ${submissionId} with analysis results`);
    await Submission.findByIdAndUpdate(submissionId, {
      executionTime: averageExecutionTime,
      score,
      passedTests,
      results: result.results || [],
      complexityAnalysis: {
        isTimeComplexityAccurate: analysis.isTimeComplexityAccurate,
        isSpaceComplexityAccurate: analysis.isSpaceComplexityAccurate,
        actualTimeComplexity: analysis.actualTimeComplexity,
        actualSpaceComplexity: analysis.actualSpaceComplexity,
        explanation: analysis.explanation,
        improvement: analysis.improvement || "",
        optimizedSolution: analysis.optimizedSolution || ""
      },
      processingComplete: true
    });
    
    console.log(`[LLM] Background processing completed for submission ${submissionId}`);
  } catch (error) {
    console.error(`[LLM] Background processing failed for submission ${submissionId}:`, error);
    
    // Update submission to mark processing as complete, even with error
    try {
      await Submission.findByIdAndUpdate(submissionId, {
        processingComplete: true,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      console.log(`[LLM] Updated submission ${submissionId} with error information`);
    } catch (updateError) {
      console.error(`[LLM] Failed to update submission ${submissionId} after processing error:`, updateError);
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

module.exports = router;
