const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const axios = require('axios'); // For making API requests to fetch test cases
const execPromise = util.promisify(exec);
const dotenv = require('dotenv');
const { initializeCleanupScheduler } = require('./cleanup')
// const STATIC_RESULTS = require('./static-results');

dotenv.config();

const router = express.Router();

// Configuration
const CODE_EXECUTION_DIR = path.join(__dirname, 'temp');
const TIMEOUT = 5000;
// const TEST_CASES_API_URL = process.env.TEST // Uncomment and update when ready

const DEFAULT_TEST_CASES = [
    {
        input: [64, 34, 25, 12, 22, 11, 90],
        expectedOutput: 11,
        description: "Basic array with positive integers"
    },
    {
        input: [-5, -2, -10, -1, -8],
        expectedOutput: -10,
        description: "Array with negative integers"
    },
    {
        input: [1],
        expectedOutput: 1,
        description: "Single element array"
    },
    {
        input: [5, 5, 5, 5, 5],
        expectedOutput: 5,
        description: "Array with identical elements"
    },
    {
        input: [999999, -999999, 0],
        expectedOutput: -999999,
        description: "Array with large values"
    }
];

// In code-execution.js, update the problems array:
let problems = [
    {
        id: 1,
        title: "Find Minimum Number",
        description: "Write a function to find the minimum number in an array",
        inputFormat: "Array of integers",
        outputFormat: "Single integer (the minimum)",
        functionName: "MinFinder",
        functionTemplate: `public class MinFinder {
    public int findMin(int[] arr) {
        // Write your code here
    }
}`,
        example: {
            input: "[5, 2, 8, 1, 9]",
            output: "1"
        },
        testCases: DEFAULT_TEST_CASES,
        showSolution: false,  // New field to control solution visibility
        solution: `public class MinFinder {
    public int findMin(int[] arr) {
        if (arr == null || arr.length == 0) {
            throw new IllegalArgumentException("Array cannot be null or empty");
        }
        
        int min = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] < min) {
                min = arr[i];
            }
        }
        return min;
    }
}`
    },
    {
        id: 2,
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        inputFormat: "An array of integers nums and an integer target value",
        outputFormat: "An array of two integers, the indices of the two numbers that add up to the target",
        constraints: [
          "2 ≤ nums.length ≤ 10^4",
          "-10^9 ≤ nums[i] ≤ 10^9",
          "-10^9 ≤ target ≤ 10^9",
          "Only one valid answer exists"
        ],
        functionName: "TwoSum",
        functionTemplate: `public class TwoSum {
          public int[] twoSum(int[] nums, int target) {
              // Write your code here
          }
      }`,
        example: {
          input: "[2, 7, 11, 15], 9",
          output: "[0, 1]"
        },
        testCases: [
          {
            input: [[2, 7, 11, 15], 9],
            expectedOutput: [0, 1],
            description: "Basic test case"
          },
          {
            input: [[3, 2, 4], 6],
            expectedOutput: [1, 2],
            description: "Target in the middle of array"
          },
          {
            input: [[3, 3], 6],
            expectedOutput: [0, 1],
            description: "Same elements"
          },
          {
            input: [[-1, -2, -3, -4, -5], -8],
            expectedOutput: [2, 4],
            description: "Negative numbers"
          },
          {
            input: [[1, 5, 8, 3, 9, 2], 10],
            expectedOutput: [1, 4],
            description: "Larger array"
          }
        ],
        showSolution: false,
        solution: `public class TwoSum {
          public int[] twoSum(int[] nums, int target) {
              java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
              
              for (int i = 0; i < nums.length; i++) {
                  int complement = target - nums[i];
                  if (map.containsKey(complement)) {
                      return new int[] { map.get(complement), i };
                  }
                  map.put(nums[i], i);
              }
              
              throw new IllegalArgumentException("No solution found");
          }
      }`
    }
];

// Ensure temp directory exists
async function ensureTempDir() {
    try {
        await fs.mkdir(CODE_EXECUTION_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating temp directory:', error);
        throw error;
    }
}

// Clean up files after execution
async function cleanup(filePath) {
    try {
        const javaFile = `${filePath}.java`;
        const classFile = `${filePath}.class`;

        try {
            // Check if files exist before trying to delete
            await fs.access(javaFile);
            await fs.unlink(javaFile);
        } catch (error) {
            // File doesn't exist, ignore
        }

        try {
            await fs.access(classFile);
            await fs.unlink(classFile);
        } catch (error) {
            // File doesn't exist, ignore
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Fetch test cases from external API
async function fetchTestCases() {
    try {
        // Uncomment when ready to use external API
        // const response = await axios.get(TEST_CASES_API_URL);
        // return response.data;
        return DEFAULT_TEST_CASES;
    } catch (error) {
        console.error('Error fetching test cases:', error);
        return DEFAULT_TEST_CASES; // Fallback to default test cases
    }
}

function createTestRunner(userCode, className, problem) {
    // Extract the actual class name and method name from user's code
    const classNameMatch = userCode.match(/public\s+class\s+(\w+)/);
    const actualClassName = classNameMatch ? classNameMatch[1] : problem.functionName;

    // Extract method name and return type from user's code
    const methodMatch = userCode.match(/public\s+(\w+(?:\[\])?\s+)?(\w+)\s*\(/);
    const methodName = methodMatch ? methodMatch[2] : 'twoSum';
    const returnType = methodMatch && methodMatch[1] ? methodMatch[1].trim() : 'int[]';

    // Determine if this is the TwoSum problem
    const isTwoSum = problem.title === "Two Sum";

    // Convert test cases to proper Java syntax based on problem type
    const testCasesStr = problem.testCases.map(tc => {
        if (isTwoSum) {
            // Handle TwoSum format with array and target value
            const [numsArray, targetValue] = tc.input;
            const inputArrayStr = `new int[]{${numsArray.join(', ')}}`;
            const expectedOutputStr = `new int[]{${tc.expectedOutput.join(', ')}}`;
            
            return `testCases.add(new TestCase(${inputArrayStr}, ${targetValue}, ${expectedOutputStr}, "${tc.description}"));`;
        } else {
            // Handle original format with single array input
            const inputArrayStr = Array.isArray(tc.input)
                ? `new int[]{${tc.input.join(', ')}}`
                : `new int[]{${tc.input}}`;
            
            return `testCases.add(new TestCase(${inputArrayStr}, ${tc.expectedOutput}, "${tc.description}"));`;
        }
    }).join('\n            ');

    // Determine appropriate test class based on problem type
    const testClassStr = isTwoSum ? 
        generateTwoSumTestClass(actualClassName, methodName, returnType) :
        generateMinFinderTestClass(actualClassName, methodName, returnType);

    // Main test runner code
    return `
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

public class ${className} {
    public static void main(String[] args) {
        try {
            List<TestCase> testCases = new ArrayList<>();
            ${testCasesStr}
            
            ${actualClassName} solution = new ${actualClassName}();
            List<TestResult> results = new ArrayList<>();
            
            ${testClassStr}
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("  \\"results\\": [");
            
            for (int i = 0; i < results.size(); i++) {
                TestResult result = results.get(i);
                json.append("    {");
                json.append("\\"testCase\\": ").append(result.testCase).append(",");
                json.append("\\"description\\": \\"").append(escapeString(result.description)).append("\\",");
                json.append("\\"input\\": \\"").append(escapeString(result.input)).append("\\",");
                json.append("\\"expectedOutput\\": \\"").append(escapeString(result.expectedOutput)).append("\\",");
                
                if (result.error != null) {
                    json.append("\\"error\\": \\"").append(escapeString(result.error)).append("\\",");
                } else {
                    json.append("\\"yourOutput\\": \\"").append(escapeString(result.yourOutput)).append("\\",");
                }
                
                json.append("\\"passed\\": ").append(result.passed).append(",");
                json.append("\\"executionTime\\": ").append(result.executionTime);
                json.append("}").append(i < results.size() - 1 ? "," : "");
            }
            
            json.append("  ]");
            json.append("}");
            
            System.out.println(json.toString());
            
        } catch (Exception e) {
            System.out.println("{");
            System.out.println("  \\"error\\": \\"" + 
                (e.getMessage() != null ? escapeString(e.getMessage()) : "Runtime Error: " + e.getClass().getSimpleName()) +
                "\\"");
            System.out.println("}");
        }
    }
    
    private static String escapeString(String str) {
        if (str == null) return "";
        return str.replace("\\\\", "\\\\\\\\")
                 .replace("\\"", "\\\\\\"")
                 .replace("\\n", "\\\\n")
                 .replace("\\r", "\\\\r")
                 .replace("\\t", "\\\\t");
    }
    
    ${isTwoSum ? generateTwoSumTestCaseClass() : generateMinFinderTestCaseClass()}
    
    static class TestResult {
        int testCase;
        String input;
        String expectedOutput;
        String yourOutput;
        boolean passed;
        double executionTime;
        String description;
        String error;
        
        TestResult(int testCase, String input, String expectedOutput, String yourOutput, 
                  boolean passed, double executionTime, String description, String error) {
            this.testCase = testCase;
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.yourOutput = yourOutput;
            this.passed = passed;
            this.executionTime = executionTime;
            this.description = description;
            this.error = error;
        }
    }
}`;
}

function generateMinFinderTestClass(className, methodName, returnType) {
    return `for (int i = 0; i < testCases.size(); i++) {
                TestCase testCase = testCases.get(i);
                TestResult result;
                
                try {
                    long startTime = System.nanoTime();
                    ${returnType} output = solution.${methodName}(testCase.input);
                    long endTime = System.nanoTime();
                    double executionTime = (endTime - startTime) / 1000000.0;
                    
                    boolean passed = String.valueOf(output).equals(String.valueOf(testCase.expectedOutput));
                    
                    result = new TestResult(
                        i + 1,
                        Arrays.toString(testCase.input),
                        String.valueOf(testCase.expectedOutput),
                        String.valueOf(output),
                        passed,
                        executionTime,
                        testCase.description,
                        null
                    );
                } catch (Exception e) {
                    String errorMessage = e.getMessage();
                    if (errorMessage == null) {
                        errorMessage = "Runtime Error: " + e.getClass().getSimpleName();
                    }
                    result = new TestResult(
                        i + 1,
                        Arrays.toString(testCase.input),
                        String.valueOf(testCase.expectedOutput),
                        null,
                        false,
                        0.0,
                        testCase.description,
                        errorMessage
                    );
                }
                results.add(result);
            }`;
}

// Helper function to generate TwoSum test class
function generateTwoSumTestClass(className, methodName, returnType) {
    return `for (int i = 0; i < testCases.size(); i++) {
                TestCase testCase = testCases.get(i);
                TestResult result;
                
                try {
                    long startTime = System.nanoTime();
                    ${returnType} output = solution.${methodName}(testCase.nums, testCase.target);
                    long endTime = System.nanoTime();
                    double executionTime = (endTime - startTime) / 1000000.0;
                    
                    // Special comparison for int[] outputs
                    boolean passed = Arrays.equals(output, testCase.expectedOutput);
                    
                    result = new TestResult(
                        i + 1,
                        "nums: " + Arrays.toString(testCase.nums) + ", target: " + testCase.target,
                        Arrays.toString(testCase.expectedOutput),
                        Arrays.toString(output),
                        passed,
                        executionTime,
                        testCase.description,
                        null
                    );
                } catch (Exception e) {
                    String errorMessage = e.getMessage();
                    if (errorMessage == null) {
                        errorMessage = "Runtime Error: " + e.getClass().getSimpleName();
                    }
                    result = new TestResult(
                        i + 1,
                        "nums: " + Arrays.toString(testCase.nums) + ", target: " + testCase.target,
                        Arrays.toString(testCase.expectedOutput),
                        null,
                        false,
                        0.0,
                        testCase.description,
                        errorMessage
                    );
                }
                results.add(result);
            }`;
}

// Helper function to generate TestCase class for MinFinder
function generateMinFinderTestCaseClass() {
    return `static class TestCase {
        int[] input;
        int expectedOutput;
        String description;
        
        TestCase(int[] input, int expectedOutput, String description) {
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.description = description;
        }
    }`;
}

// Helper function to generate TestCase class for TwoSum
function generateTwoSumTestCaseClass() {
    return `static class TestCase {
        int[] nums;
        int target;
        int[] expectedOutput;
        String description;
        
        TestCase(int[] nums, int target, int[] expectedOutput, String description) {
            this.nums = nums;
            this.target = target;
            this.expectedOutput = expectedOutput;
            this.description = description;
        }
    }`;
}


router.get('/problems', (req, res) => {
    try {
        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// Get a single problem
router.get('/problem/:id', (req, res) => {
    try {
        const problem = problems.find(p => p.id === parseInt(req.params.id));
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        res.json(problem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});

// Create a new problem
router.post('/problem', (req, res) => {
    try {
        const newProblem = {
            ...req.body,
            id: problems.length + 1
        };
        problems.push(newProblem);
        res.status(201).json(newProblem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create problem' });
    }
});

// Update a problem
router.put('/problem/:id', (req, res) => {
    try {
        const problemId = parseInt(req.params.id);
        const index = problems.findIndex(p => p.id === problemId);

        if (index === -1) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Preserve the ID when updating
        const updatedProblem = {
            ...req.body,
            id: problemId
        };

        problems[index] = updatedProblem;
        res.json(updatedProblem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update problem' });
    }
});

// Delete a problem
router.delete('/problem/:id', (req, res) => {
    try {
        const problemId = parseInt(req.params.id);
        const index = problems.findIndex(p => p.id === problemId);

        if (index === -1) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Reindex remaining problems
        problems.splice(index, 1);

        // Reindex remaining problems in place
        problems.forEach((problem, idx) => {
            problem.id = idx + 1;
        });

        res.status(200).json({
            success: true,
            message: 'Problem deleted successfully',
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete problem',
            details: error.message
        });
    }
});

// In code-execution.js, update the submission endpoint

router.post('/submit', async (req, res) => {
    const { code, problemId } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // Get the current problem
    const problem = problems.find(p => p.id === problemId);
    if (!problem) {
        return res.status(400).json({ error: 'Problem not found' });
    }

    // Extract the class name from user's code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
    const actualClassName = classNameMatch ? classNameMatch[1] : problem.functionName;

    // Create unique identifier for this submission
    const submissionId = uuidv4();
    const className = `Submission_${submissionId.replace(/-/g, '_')}`;
    const filePath = path.join(CODE_EXECUTION_DIR, className);
    const userCodePath = path.join(CODE_EXECUTION_DIR, actualClassName);

    try {
        // Ensure temp directory exists
        await ensureTempDir();

        // Write user's code file
        await fs.writeFile(`${userCodePath}.java`, code);

        // Generate and write test runner
        const testRunner = createTestRunner(code, className, problem);
        await fs.writeFile(`${filePath}.java`, testRunner);

        try {
            // Compile both files
            const compileCommand = `javac ${filePath}.java ${userCodePath}.java`;
            console.log('Compiling with command:', compileCommand);
            
            try {
                await execPromise(compileCommand);
                console.log('Compilation successful');
            } catch (compileError) {
                console.error('Compilation failed:', compileError);
                // Clean up files
                await cleanup(filePath);
                await cleanup(userCodePath);
                
                return res.status(400).json({
                    success: false,
                    error: compileError.stderr
                });
            }

            // If compilation succeeds, run the code
            try {
                console.log('Running code...');
                const { stdout, stderr } = await execPromise(`java -cp ${CODE_EXECUTION_DIR} ${className}`, {
                    timeout: TIMEOUT
                });

                console.log('Code execution completed');
                const results = JSON.parse(stdout);

                // Clean up files
                await cleanup(filePath);
                await cleanup(userCodePath);

                return res.json({
                    success: !results.error,
                    ...results
                });
            } catch (runtimeError) {
                console.error('Runtime error:', runtimeError);
                await cleanup(filePath);
                await cleanup(userCodePath);

                return res.status(500).json({
                    success: false,
                    error: runtimeError.message || 'Runtime error occurred',
                    details: runtimeError.stderr
                });
            }
        } catch (error) {
            console.error('Error during execution:', error);
            await cleanup(filePath);
            await cleanup(userCodePath);

            return res.status(500).json({
                success: false,
                error: 'Error executing code',
                details: error.message
            });
        }
    } catch (error) {
        console.error('Error in submission process:', error);
        await cleanup(filePath);
        await cleanup(userCodePath);

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Route to fetch test cases (commented out for now)
/*
router.get('/test-cases', async (req, res) => {
    try {
        const testCases = await fetchTestCases();
        res.json({
            success: true,
            testCases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch test cases'
        });
    }
});
*/

initializeCleanupScheduler();

module.exports = router;