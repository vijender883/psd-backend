const express = require('express');
const { executeJavaCode } = require('../services/codeExecutor');
const router = express.Router();

// Sample problem definitions
const problems = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and a target value, find the indices of two numbers in the array that add up to the target.',
    inputFormat: 'The first line contains space-separated integers representing the array.\nThe second line contains a single integer representing the target sum.',
    outputFormat: 'Output two space-separated integers representing the indices of the two numbers that add up to the target.',
    constraints: [
      '2 ≤ array length ≤ 100', 
      '-1000 ≤ array elements ≤ 1000',
      'The input will have exactly one valid solution',
      'You may not use the same element twice'
    ],
    example: {
      input: '2 7 11 15\n9',
      output: '0 1'
    },
    functionTemplate: 'class TwoSum {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}',
    solution: 'class TwoSum {\n    public int[] twoSum(int[] nums, int target) {\n        for (int i = 0; i < nums.length; i++) {\n            for (int j = i + 1; j < nums.length; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return new int[] {i, j};\n                }\n            }\n        }\n        return new int[] {}; // No solution found\n    }\n}',
    testCases: [
      {
        input: '2 7 11 15\n9',
        expectedOutput: '0 1',
        description: 'Basic test case'
      },
      {
        input: '3 2 4\n6',
        expectedOutput: '1 2',
        description: 'Target in middle of array'
      },
      {
        input: '3 3\n6',
        expectedOutput: '0 1',
        description: 'Duplicate numbers'
      },
      {
        input: '1 5 8 3 9 12\n21',
        expectedOutput: '2 5',
        description: 'Larger array'
      },
      {
        input: '-1 -2 -3 -4 -5\n-8',
        expectedOutput: '2 4',
        description: 'Negative numbers'
      }
    ]
  }
  // You can remove the find-min problem or keep it as needed
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
  const problem = problems[req.params.id];
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

// Submit code for execution
router.post('/submit', async (req, res) => {
  const { code, problemId } = req.body;
  
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
    // Execute code against test cases
    const result = await executeJavaCode(code, problem.testCases);
    console.log(result);
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