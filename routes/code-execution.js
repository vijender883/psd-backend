// File: routes/code-execution.js
const express = require('express');
const { executeCode } = require('../services/codeExecutor');
const router = express.Router();
const Submission = require('../models/Submission');
const { analyzeProblemAndSolution } = require('../services/llmService');
const { problems, getProblemList } = require('../models/problems'); // Import from the new file

const problemsCache = new Map();
const CACHE_TTL = 3600000;

const testConfigurations = {};

function initializeTestConfig(simulationId) {
  let configChanged = false;
  
  if (!testConfigurations[simulationId]) {
    testConfigurations[simulationId] = {
      scheduledStartTime: new Date('2025-03-20T04:38:10Z').toISOString(),
      testDuration: 2 * 60, // 3 minutes (changed from 60 minutes for testing)
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
    // console.log(submission);

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
      language: submission.language || 'java' // Include language info, default to java for backward compatibility
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
      language: submission.language || 'java' // Include language info, default to java for backward compatibility
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

    res.json({
      id: submission._id,
      show: submission.show,
      createdAt: submission.createdAt,
      language: submission.language || 'java'
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
router.post('/analyze', async (req, res) => {
  const { code, problemId, username, timeComplexity, spaceComplexity, language = 'java' } = req.body;

  const problem = problems[problemId];
  if (!problem) {
    return res.status(404).json({
      success: false,
      error: 'Problem not found'
    });
  }

  try {
    // Execute code first, passing the language parameter
    const result = await executeCode(code, problem.testCases, language);

    if (!result.success) {
      return res.json(result);
    }

    // Analyze with LLM - skip suspicion check for now
    const analysis = await analyzeProblemAndSolution(
      problem,
      code,
      timeComplexity,
      spaceComplexity,
      language
    );

    // Calculate metrics
    const totalTests = result.results.length;
    const passedTests = result.results.filter(r => r.passed).length;
    const averageExecutionTime = result.results.reduce((sum, r) =>
      sum + r.executionTime, 0) / totalTests;
    const score = (passedTests / totalTests) * 100;

    // Create and save submission
    const submission = new Submission({
      username,
      problemId,
      code,
      language, // Save the language used
      executionTime: averageExecutionTime,
      score,
      passedTests,
      totalTests,
      results: result.results,
      timeComplexity,
      spaceComplexity,
      show: false, // Default to not showing results until admin approves
      isSuspicious: false, // Skip suspicion check as requested
      suspicionLevel: 'low',
      suspicionReasons: [],
      complexityAnalysis: {
        isTimeComplexityAccurate: analysis.isTimeComplexityAccurate,
        isSpaceComplexityAccurate: analysis.isSpaceComplexityAccurate,
        actualTimeComplexity: analysis.actualTimeComplexity,
        actualSpaceComplexity: analysis.actualSpaceComplexity,
        explanation: analysis.explanation
      }
    });

    await submission.save();

    console.log(submission._id);

    // Return minimal information after submission
    res.json({
      success: true,
      message: "Submission received successfully",
      submissionId: submission._id,
      pendingApproval: true
    });

  } catch (error) {
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

module.exports = router;