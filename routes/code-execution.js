const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const axios = require('axios'); // For making API requests to fetch test cases
const execPromise = util.promisify(exec);
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Configuration
const CODE_EXECUTION_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/code-execution'
  : path.join(__dirname, 'temp');
const TIMEOUT = 5000;
// const TEST_CASES_API_URL = process.env.TEST_CASES_API_URL // Uncomment and update when ready

// Predefined test cases
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
        await Promise.all([
            fs.unlink(`${filePath}.java`).catch(() => {}),
            fs.unlink(`${filePath}.class`).catch(() => {})
        ]);
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

function createTestRunner(userCode, className) {
    return `
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

// Main test file
public class ${className} {
    public static void main(String[] args) {
        try {
            // Initialize test cases
            List<TestCase> testCases = new ArrayList<>();
            testCases.add(new TestCase(new int[]{64, 34, 25, 12, 22, 11, 90}, 11, "Basic array with positive integers"));
            testCases.add(new TestCase(new int[]{-5, -2, -10, -1, -8}, -10, "Array with negative integers"));
            testCases.add(new TestCase(new int[]{1}, 1, "Single element array"));
            testCases.add(new TestCase(new int[]{5, 5, 5, 5, 5}, 5, "Array with identical elements"));
            testCases.add(new TestCase(new int[]{999999, -999999, 0}, -999999, "Array with large values"));
            
            // Create instance of user's solution class
            MinFinder solution = new MinFinder();
            
            // Store results
            List<TestResult> results = new ArrayList<>();
            
            // Run all test cases
            for (int i = 0; i < testCases.size(); i++) {
                TestCase testCase = testCases.get(i);
                
                // Start timing
                long startTime = System.nanoTime();
                
                // Run user's solution
                int result = solution.findMin(testCase.input.clone()); // Clone to prevent modification
                
                // End timing
                long endTime = System.nanoTime();
                double executionTime = (endTime - startTime) / 1000000.0;
                
                // Check if result is correct
                boolean passed = (result == testCase.expectedOutput);
                
                // Store result
                results.add(new TestResult(
                    i + 1,
                    Arrays.toString(testCase.input),
                    testCase.expectedOutput,
                    result,
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
                System.out.println("      \\"expectedOutput\\": " + result.expectedOutput + ",");
                System.out.println("      \\"yourOutput\\": " + result.yourOutput + ",");
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
        int expectedOutput;
        int yourOutput;
        boolean passed;
        double executionTime;
        String description;
        
        TestResult(int testCase, String input, int expectedOutput, int yourOutput, 
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
}

${userCode}
`;
}

router.post('/submit', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // Create unique identifier for this submission
    const submissionId = uuidv4();
    const className = `Submission_${submissionId.replace(/-/g, '_')}`;
    const filePath = path.join(CODE_EXECUTION_DIR, className);

    try {
        // Ensure temp directory exists
        await ensureTempDir();

        // Create Java file with test runner
        const fullCode = createTestRunner(code, className);
        await fs.writeFile(`${filePath}.java`, fullCode);

        // Compile Java file
        const compileCommand = `javac ${filePath}.java`;
        await execPromise(compileCommand);

        // Run the compiled code with timeout
        const { stdout, stderr } = await execPromise(`java -cp ${CODE_EXECUTION_DIR} ${className}`, {
            timeout: TIMEOUT
        });

        // Parse results
        const results = JSON.parse(stdout);

        // Add summary statistics
        const testResults = results.results || [];
        const summary = {
            totalTests: testResults.length,
            passedTests: testResults.filter(r => r.passed).length,
            averageExecutionTime: testResults.reduce((acc, r) => acc + r.executionTime, 0) / testResults.length
        };

        // Cleanup files
        await cleanup(filePath);

        // Send results with summary
        res.json({
            success: true,
            ...results,
            summary,
            error: stderr || null
        });

    } catch (error) {
        console.error('Error executing code:', error);

        // Cleanup files
        await cleanup(filePath);

        // Handle different types of errors
        if (error.code === 'ETIMEDOUT') {
            return res.status(408).json({
                success: false,
                error: 'Code execution timed out'
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

module.exports = router;