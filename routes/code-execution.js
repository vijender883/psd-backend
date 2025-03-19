// File: routes/code-execution.js
const express = require('express');
const { executeCode } = require('../services/codeExecutor');
const router = express.Router();
const Submission = require('../models/Submission');
const { analyzeProblemAndSolution } = require('../services/llmService');

const problemsCache = new Map();
const CACHE_TTL = 3600000;

const problems = {
  // Existing problems with both Java and Python templates
  'diagonaltraversal': {
    id: 'diagonaltraversal',
    title: 'Binary Tree Diagonal Traversal',
    description: `Given the root of a binary tree, return the diagonal traversal of its nodes' values. A diagonal path consists of nodes that can be reached by following only the right child pointers. When you can't go right anymore, you move to the leftmost node of the next diagonal path.

<div style="text-align: center; margin: 20px 0;">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 450">
        <!-- Background for better visibility -->
    <rect width="500" height="400" fill="#ffffff"/>
    
    <!-- Tree edges -->
    <g stroke="#666" stroke-width="2">
        <!-- Level 1 edges -->
        <path d="M250,50 L150,120" />
        <path d="M250,50 L350,120" />
        <!-- Level 2 edges -->
        <path d="M150,120 L100,190" />
        <path d="M150,120 L200,190" />
        <path d="M350,120 L450,190" />
        <!-- Level 3 edge -->
        <path d="M200,190 L175,260" />
        <path d="M450,190 L500,260" />
    </g>

    <!-- Diagonal path highlights -->
    <!-- First diagonal path: 1->3->6->8 -->
    <path d="M250,50 L350,120 L450,190 L500,260" 
          stroke="#4CAF50" stroke-width="4" fill="none" 
          stroke-dasharray="5,5"/>
        <!-- Second diagonal path: 2->5 -->
    <path d="M150,120 L200,190" 
          stroke="#2196F3" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>
    <!-- Third diagonal path: 4 -->
    <path d="M100,190 L100,190" 
          stroke="#FFC107" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>
    <!-- Fourth diagonal path: 7 -->
    <path d="M175,260 L175,260" 
          stroke="#9C27B0" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>

    <!-- Tree nodes -->
    <g>
        <!-- Level 1 -->
        <circle cx="250" cy="50" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="250" y="55" text-anchor="middle" font-family="Arial" font-size="16">1</text>

        <!-- Level 2 -->
        <circle cx="150" cy="120" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="150" y="125" text-anchor="middle" font-family="Arial" font-size="16">2</text>
        
        <circle cx="350" cy="120" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="350" y="125" text-anchor="middle" font-family="Arial" font-size="16">3</text>
        
        <!-- Level 3 -->
        <circle cx="100" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="16">4</text>
        
        <circle cx="200" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="200" y="195" text-anchor="middle" font-family="Arial" font-size="16">5</text>
        
        <circle cx="450" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="450" y="195" text-anchor="middle" font-family="Arial" font-size="16">6</text>

            <!-- Level 4 -->
        <circle cx="175" cy="260" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="175" y="265" text-anchor="middle" font-family="Arial" font-size="16">7</text>
        
        <circle cx="500" cy="260" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="500" y="265" text-anchor="middle" font-family="Arial" font-size="16">8</text>
    </g>

    <!-- Legend -->
    <g transform="translate(20, 320)">
        <rect width="460" height="60" fill="#f8f9fa" rx="5"/>
        <text x="10" y="20" font-family="Arial" font-size="14" fill="#333">Diagonal Paths:</text>
        <g transform="translate(10, 35)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#4CAF50" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="30" y="5" font-family="Arial" font-size="12">Path 1: 1→3→6→8</text>
            
            <line x1="150" y1="0" x2="170" y2="0" stroke="#2196F3" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="180" y="5" font-family="Arial" font-size="12">Path 2: 2→5</text>
            
            <line x1="270" y1="0" x2="290" y2="0" stroke="#FFC107" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="300" y="5" font-family="Arial" font-size="12">Path 3: 4</text>
            
            <line x1="370" y1="0" x2="390" y2="0" stroke="#9C27B0" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="400" y="5" font-family="Arial" font-size="12">Path 4: 7</text>
        </g>
    </g>
  </svg>
</div>

In the above tree:
- Diagonal 1 (green): 1 → 3 → 6 → 8
- Diagonal 2 (blue): 2 → 5
- Diagonal 3 (yellow): 4
- Diagonal 4 (purple): 7

The output should be: [[1,3,6,8], [2,5], [4], [7]]`,
    inputFormat: 'The input is provided as a series of space-separated integers representing the tree in level-order format. Use -1 to represent null nodes.',
    outputFormat: 'Return a list of lists where each inner list represents nodes in a diagonal path from left to right.',
    constraints: [
      'The number of nodes in the tree is in the range [0, 104]',
      '-100 <= Node.val <= 100'
    ],
    example: {
      input: '1 2 3 4 5 -1 6',
      output: '[[1,3,6],[2,5],[4]]'
    },
    templates: {
      java: 'class DiagonalTraversal {\n    public List<List<Integer>> diagonalTraversal(TreeNode root) {\n        // Write your code here\n    }\n}',
      python: 'class DiagonalTraversal:\n    def diagonal_traversal(self, root):\n        # Write your code here\n        pass'
    },
    solution: '// Your diagonal traversal solution here',
    testCases: [
      {
        input: '1 2 3 4 5 -1 6',
        expectedOutput: '[[1,3,6],[2,5],[4]]',
        description: 'Example test case'
      },
      {
        input: '3 9 20 -1 -1 15 7',
        expectedOutput: '[[3,20,7],[9,15]]',
        description: 'Test case with balanced tree'
      }
    ]
  },

  'longestincreasing': {
    id: 'longestincreasing',
    title: 'Longest Increasing Subsequence',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nA subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.',
    inputFormat: 'The first line contains an integer n denoting the size of the array.\nThe second line contains n space-separated integers denoting the elements of the array.',
    outputFormat: 'Return an integer representing the length of the longest strictly increasing subsequence.',
    constraints: [
      '1 <= nums.length <= 2500',
      '-104 <= nums[i] <= 104'
    ],
    example: {
      input: '8\n10 9 2 5 3 7 101 18',
      output: '4'
    },
    templates: {
      java: 'class LengthOfLIS {\n    public int lengthOfLIS(int[] nums) {\n        // Write your code here\n    }\n}',
      python: 'class LengthOfLIS:\n    def length_of_lis(self, nums):\n        # Write your code here\n        pass'
    },
    solution: '// Your LIS solution here',
    testCases: [
      {
        input: '8\n10 9 2 5 3 7 101 18',
        expectedOutput: '4',
        description: 'Example test case'
      },
      {
        input: '6\n0 1 0 3 2 3',
        expectedOutput: '4',
        description: 'Test case with duplicates'
      },
      {
        input: '7\n7 7 7 7 7 7 7',
        expectedOutput: '1',
        description: 'Test case with all same numbers'
      }
    ]
  },
  'minimumpathsum': {
    id: 'minimumpathsum',
    title: 'Minimum Path Sum',
    description: 'Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.<br><br>Note: You can only move either down or right at any point in time.<br><br><img src="https://assets.leetcode.com/uploads/2020/11/05/minpath.jpg" alt="Grid Example" style="width: 180px; height: auto; display: block; margin: 1.5rem 1rem 2rem 1rem">',
    inputFormat: 'The first line contains two space-separated integers m and n representing the grid dimensions.\nThe next m lines contain n space-separated integers each representing the grid values.',
    outputFormat: 'Output a single integer representing the minimum path sum.',
    constraints: [
      '1 ≤ m, n ≤ 200',
      '0 ≤ grid[i][j] ≤ 100'
    ],
    example: {
      input: '3 3\n1 3 1\n1 5 1\n4 2 1',
      output: '7'
    },
    templates: {
      java: 'class MinPathSum {\n    public int minPathSum(int[][] grid) {\n        // Write your code here\n    }\n}',
      python: 'class MinPathSum:\n    def min_path_sum(self, grid):\n        # Write your code here\n        pass'
    },
    solution: 'class MinPathSum {\n    public int minPathSum(int[][] grid) {\n        int m = grid.length;\n        int n = grid[0].length;\n        \n        // Calculate cumulative sums\n        for(int i = 0; i < m; i++) {\n            for(int j = 0; j < n; j++) {\n                if(i == 0 && j == 0) continue;\n                else if(i == 0) grid[i][j] += grid[i][j-1];\n                else if(j == 0) grid[i][j] += grid[i-1][j];\n                else grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);\n            }\n        }\n        \n        return grid[m-1][n-1];\n    }\n}',
    testCases: [
      {
        input: '3 3\n1 3 1\n1 5 1\n4 2 1',
        expectedOutput: '7',
        description: 'Example test case'
      },
      {
        input: '2 3\n1 2 3\n4 5 6',
        expectedOutput: '12',
        description: 'Simple rectangular grid'
      },
      {
        input: '1 1\n5',
        expectedOutput: '5',
        description: '1x1 grid'
      },
      {
        input: '3 3\n9 9 9\n9 9 9\n9 9 9',
        expectedOutput: '45',
        description: 'Grid with all same values'
      }
    ]
  },
  'longestcommonprefix': {
    id: 'longestcommonprefix',
    title: 'Longest Common Prefix',
    description: 'Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string "".',
    inputFormat: 'A single line containing space-separated strings.',
    outputFormat: 'Output the longest common prefix string. If there is no common prefix, output an empty string.',
    constraints: [
      '1 ≤ strs.length ≤ 200',
      '0 ≤ strs[i].length ≤ 200',
      'strs[i] consists of only lowercase English letters'
    ],
    example: {
      input: 'flower flow flight',
      output: 'fl'
    },
    templates: {
      java: 'class LongestPrefix {\n    public String longestCommonPrefix(String[] strs) {\n        // Write your code here\n    }\n}',
      python: 'class LongestPrefix:\n    def longest_common_prefix(self, strs):\n        # Write your code here\n        pass'
    },
    solution: 'class LongestPrefix {\n    public String longestCommonPrefix(String[] strs) {\n        if (strs == null || strs.length == 0) return "";\n        \n        String prefix = strs[0];\n        for(int i = 1; i < strs.length; i++) {\n            while(strs[i].indexOf(prefix) != 0) {\n                prefix = prefix.substring(0, prefix.length() - 1);\n                if(prefix.isEmpty()) return "";\n            }\n        }\n        return prefix;\n    }\n}',
    testCases: [
      {
        input: 'flower flow flight',
        expectedOutput: 'fl',
        description: 'Basic test case'
      },
      {
        input: 'dog racecar car',
        expectedOutput: '',
        description: 'No common prefix'
      },
      {
        input: 'interspecies interstellar interstate',
        expectedOutput: 'inters',
        description: 'Longer common prefix'
      },
      {
        input: 'throne throne throne',
        expectedOutput: 'throne',
        description: 'All strings are identical'
      }
    ]
  }
};

// Convert problem list to include language-specific templates
const problemList = Object.values(problems).map(problem => ({
  id: problem.id,
  title: problem.title,
  description: problem.description,
  inputFormat: problem.inputFormat,
  outputFormat: problem.outputFormat,
  constraints: problem.constraints,
  example: problem.example,
  showSolution: !!problem.solution
}));

const testConfigurations = {};

function initializeTestConfig(simulationId) {
  let configChanged = false;
  
  if (!testConfigurations[simulationId]) {
    testConfigurations[simulationId] = {
      scheduledStartTime: new Date('2025-03-19T04:04:10Z').toISOString(),
      testDuration: 3 * 60, // 3 minutes (changed from 60 minutes for testing)
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

module.exports = router;

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