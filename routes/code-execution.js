// File: routes/code-execution.js
const express = require('express');
const { executeJavaCode } = require('../services/codeExecutor');
const router = express.Router();
const Submission = require('../models/Submission');

// Sample problem definitions
const problems = {
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
    functionTemplate: 'class MinPathSum {\n    public int minPathSum(int[][] grid) {\n        // Write your code here\n    }\n}',
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
    functionTemplate: 'class LongestPrefix {\n    public String longestCommonPrefix(String[] strs) {\n        // Write your code here\n    }\n}',
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

const problemList = Object.values(problems).map(problem => ({
  id: problem.id,
  title: problem.title,
  description: problem.description,
  inputFormat: problem.inputFormat,
  outputFormat: problem.outputFormat,
  constraints: problem.constraints,
  example: problem.example,
  functionTemplate: problem.functionTemplate,
  showSolution: !!problem.solution
}));

// Get all problems
router.get('/problems', (req, res) => {
  res.json(problemList);
});

// Get a specific problem
router.get('/problems/:id', (req, res) => {
  console.log('Requested problem ID:', req.params.id);
  console.log('Available problems:', Object.keys(problems));
  const problem = problems[req.params.id];
  console.log('Found problem:', problem);
  if (!problem) {
    return res.status(404).json({ 
      success: false,
      error: 'Problem not found' 
    });
  }
  
  // Don't send test cases to frontend
  const { testCases, ...problemData } = problem;
  
  res.json({
    ...problemData,
    showSolution: !!problem.solution
  });
});

// Get submissions with optional username filter
router.get('/submissions', async (req, res) => {
  try {
    const { username } = req.query;
    const query = username ? { username } : {};
    
    const submissions = await Submission.find(query)
      .sort({ score: -1, createdAt: -1 })
      .select('username problemId score passedTests totalTests executionTime createdAt');
    
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

// Submit code for execution
router.post('/submit', async (req, res) => {
  const { code, problemId, username } = req.body;
  
  // Input validation
  if (!code || !problemId || !username) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields',
        stack: 'Code, problemId, and username are required'
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
    // Execute code against test cases
    const result = await executeJavaCode(code, problem.testCases);
    
    if (!result.success) {
      return res.json(result);
    }

    // Calculate summary
    const totalTests = result.results.length;
    const passedTests = result.results.filter(result => result.passed).length;
    const averageExecutionTime = result.results.reduce((sum, result) => 
      sum + result.executionTime, 0) / totalTests;
    const score = (passedTests / totalTests) * 100;

    // Create submission record
    const submission = new Submission({
      username,
      problemId,
      code,
      executionTime: averageExecutionTime,
      score,
      passedTests,
      totalTests,
      results: result.results
    });

    // Save to MongoDB
    await submission.save();

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