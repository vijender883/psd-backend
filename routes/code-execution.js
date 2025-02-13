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
        testCases: DEFAULT_TEST_CASES  // Using your existing test cases
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
    const methodMatch = userCode.match(/public\s+(\w+)\s+(\w+)\s*\(/);
    const methodName = methodMatch ? methodMatch[2] : 'findMin';
    const returnType = methodMatch ? methodMatch[1] : 'String';

    // Convert test cases to proper Java array syntax
    const testCasesStr = problem.testCases.map(tc => {
        const inputArrayStr = Array.isArray(tc.input)
            ? `new int[]{${tc.input.join(', ')}}`
            : `new int[]{${tc.input}}`;

        return `testCases.add(new TestCase(${inputArrayStr}, ${tc.expectedOutput}, "${tc.description}"));`;
    }).join('\n            ');

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
            
            // Create instance of user's solution class
            ${actualClassName} solution = new ${actualClassName}();
            
            // Store results
            List<TestResult> results = new ArrayList<>();
            
            // Run all test cases
            for (int i = 0; i < testCases.size(); i++) {
                TestCase testCase = testCases.get(i);
                
                long startTime = System.nanoTime();
                ${returnType} result = solution.${methodName}(testCase.input);
                long endTime = System.nanoTime();
                double executionTime = (endTime - startTime) / 1000000.0;
                
                boolean passed = String.valueOf(result).equals(String.valueOf(testCase.expectedOutput));
                
                results.add(new TestResult(
                    i + 1,
                    Arrays.toString(testCase.input),
                    String.valueOf(testCase.expectedOutput),
                    String.valueOf(result),
                    passed,
                    executionTime,
                    testCase.description
                ));
            }
            
            // Format output as JSON
            System.out.println("{");
            System.out.println("  \\"results\\": [");
            for (int i = 0; i < results.size(); i++) {
                TestResult result = results.get(i);
                System.out.println("    {");
                System.out.println("      \\"testCase\\": " + result.testCase + ",");
                System.out.println("      \\"description\\": \\"" + result.description + "\\",");
                System.out.println("      \\"input\\": \\"" + result.input + "\\",");
                System.out.println("      \\"expectedOutput\\": \\"" + result.expectedOutput + "\\",");
                System.out.println("      \\"yourOutput\\": \\"" + result.yourOutput + "\\",");
                System.out.println("      \\"passed\\": " + result.passed + ",");
                System.out.println("      \\"executionTime\\": " + result.executionTime);
                System.out.println("    }" + (i < results.size() - 1 ? "," : ""));
            }
            System.out.println("  ]");
            System.out.println("}");
        } catch (Exception e) {
            System.out.println("{");
            String errorMsg = e.getMessage();
            if (errorMsg != null) {
                errorMsg = errorMsg.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
            } else {
                errorMsg = "Runtime Error: " + e.getClass().getSimpleName();
            }
            System.out.println("  \\"error\\": \\"" + errorMsg + "\\"");
            System.out.println("}");
        }
    }
    
    // Test case class
    static class TestCase {
        int[] input;
        int expectedOutput;
        String description;
        
        TestCase(int[] input, int expectedOutput, String description) {
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.description = description;
        }
    }
    
    // Test result class
    static class TestResult {
        int testCase;
        String input;
        String expectedOutput;
        String yourOutput;
        boolean passed;
        double executionTime;
        String description;
        
        TestResult(int testCase, String input, String expectedOutput, String yourOutput, 
                  boolean passed, double executionTime, String description) {
            this.testCase = testCase;
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.yourOutput = yourOutput;
            this.passed = passed;
            this.executionTime = executionTime;
            this.description = description;
        }
    }
}`;
}


router.get('/problems', (req, res) => {
    res.json(problems);
});

router.get('/problem/:id', (req, res) => {
    const problem = problems.find(p => p.id === parseInt(req.params.id));
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
    console.log(problem);
});

router.post('/problem', (req, res) => {
    const newProblem = {
        ...req.body,
        id: problems.length + 1
    };
    problems.push(newProblem);
    res.json(newProblem);
    console.log(problems);
});

router.post('/submit', async (req, res) => {
    const { code, problemId } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // Get the current problem
    const problem = problems.find(p => p.id === problemId) || problems[problems.length - 1];
    if (!problem) {
        return res.status(400).json({ error: 'Problem not found' });
    }

    // Extract the actual class name from user's code
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

        // First, write the user's code file with the correct class name
        await fs.writeFile(`${userCodePath}.java`, code);

        // Generate and write the test runner file
        const testRunner = createTestRunner(code, className, problem);
        await fs.writeFile(`${filePath}.java`, testRunner);

        try {
            // Compile both files
            const compileCommand = `javac ${filePath}.java ${userCodePath}.java`;
            await execPromise(compileCommand);

            // Run the compiled code with timeout
            const { stdout, stderr } = await execPromise(`java -cp ${CODE_EXECUTION_DIR} ${className}`, {
                timeout: TIMEOUT
            });

            // Parse results
            const results = JSON.parse(stdout);

            // Add summary statistics if results exist
            if (results.results) {
                const testResults = results.results;
                const summary = {
                    totalTests: testResults.length,
                    passedTests: testResults.filter(r => r.passed).length,
                    averageExecutionTime: testResults.reduce((acc, r) => acc + r.executionTime, 0) / testResults.length
                };
                results.summary = summary;
            }

            // Cleanup files
            await cleanup(filePath);
            await cleanup(userCodePath);

            res.json({
                success: !results.error,
                ...results,
                error: stderr || results.error || null
            });

        } catch (error) {
            // Cleanup files in case of error
            await cleanup(filePath);
            await cleanup(userCodePath);
            throw error;
        }
    } catch (error) {
        console.error('Error executing code:', error);

        if (error.code === 'ETIMEDOUT') {
            return res.status(408).json({
                success: false,
                error: 'Code execution timed out'
            });
        }

        // Check if it's a compilation error
        if (error.stderr && error.stderr.includes('error:')) {
            return res.status(400).json({
                success: false,
                error: error.stderr
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.stderr || null
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