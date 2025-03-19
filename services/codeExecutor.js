const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Add a simple queue implementation
class ExecutionQueue {
  constructor(maxConcurrent = 10) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.processQueue();
    }
  }
}

// Create an execution queue with capacity based on your server resources
const executionQueue = new ExecutionQueue(5);

const BASE_DIR = '/tmp/code-runner';

// Initialize the execution directory
async function initializeDirectories() {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create base directory:', err);
  }
}

// Import the wrapper generators
const { generateJavaWrapper } = require('./javaWrapper');
const { generatePythonWrapper } = require('./pythonWrapper');

// Execute code - main function that handles both Java and Python
async function executeCode(code, testCases, language) {
  // Queue the execution and return the promise
  return executionQueue.enqueue(() => {
    if (language === 'python') {
      return executePythonCode(code, testCases);
    } else {
      return executeJavaCode(code, testCases);
    }
  });
}

// Execute Java code
async function executeJavaCode(code, testCases) {
  const submissionId = uuidv4();
  const executionDir = path.join(BASE_DIR, submissionId);

  try {
    // Create execution directory
    await fs.mkdir(executionDir, { recursive: true });

    // Generate wrapped Java code
    await generateJavaWrapper(executionDir, code);

    // Compile code
    await compileJavaCode(executionDir);

    // Run test cases
    const results = await runJavaTestCases(executionDir, testCases);

    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error(`Execution error for ${submissionId}:`, error);

    if (error.message.includes('Compilation failed')) {
      return {
        success: false,
        error: {
          message: 'Compilation Error',
          stack: error.message
        }
      };
    }

    return {
      success: false,
      error: {
        message: 'Execution Error',
        stack: error.message
      }
    };
  }
  // At the end of executeJavaCode and executePythonCode functions
  finally {
    // Clean up after execution
    try {
      // Use a non-blocking timeout to not delay the response
      setTimeout(() => {
        cleanupDirectory(executionDir).catch(err =>
          console.error(`Failed to clean up directory ${executionDir}: ${err.message}`)
        );
      }, 1000);
    } catch (cleanupError) {
      console.error(`Error scheduling cleanup: ${cleanupError.message}`);
    }
  }
}

// Execute Python code
async function executePythonCode(code, testCases) {
  const submissionId = uuidv4();
  const executionDir = path.join(BASE_DIR, submissionId);

  try {
    // Create execution directory
    await fs.mkdir(executionDir, { recursive: true });

    // Generate wrapped Python code
    await generatePythonWrapper(executionDir, code);

    // Run test cases
    const results = await runPythonTestCases(executionDir, testCases);

    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error(`Python execution error for ${submissionId}:`, error);

    return {
      success: false,
      error: {
        message: 'Python Execution Error',
        stack: error.message
      }
    };
  }
  // At the end of executeJavaCode and executePythonCode functions
  finally {
    // Clean up after execution
    try {
      // Use a non-blocking timeout to not delay the response
      setTimeout(() => {
        cleanupDirectory(executionDir).catch(err =>
          console.error(`Failed to clean up directory ${executionDir}: ${err.message}`)
        );
      }, 1000);
    } catch (cleanupError) {
      console.error(`Error scheduling cleanup: ${cleanupError.message}`);
    }
  }
}

const COMPILATION_TIMEOUT = 15000;  // Increase from 10000
const EXECUTION_TIMEOUT = 8000;     // Increase from 5000

// Compile Java code
function compileJavaCode(executionDir) {
  return new Promise((resolve, reject) => {
    const process = spawn('javac', ['Solution.java'], {
      cwd: executionDir,
      timeout: COMPILATION_TIMEOUT
    });

    let stderr = '';

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Compilation failed: ${stderr}`));
      } else {
        resolve();
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start compilation process: ${err.message}`));
    });
  });
}

// Run Java test cases
async function runJavaTestCases(executionDir, testCases) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testCaseNumber = i + 1;

    const result = {
      testCase: testCaseNumber,
      description: testCase.description || `Test case ${testCaseNumber}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput
    };

    try {
      // Start timing execution
      const startTime = process.hrtime();

      // Run Java program with the test case
      const output = await runJavaProgram(executionDir, testCase.input);

      // Calculate execution time
      const endTime = process.hrtime(startTime);
      const executionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

      // Check if output matches expected output
      const normalizedOutput = output.trim();
      const normalizedExpected = testCase.expectedOutput.trim();
      const passed = normalizedOutput === normalizedExpected;

      result.passed = passed;
      result.yourOutput = normalizedOutput;
      result.executionTime = executionTime;
    } catch (error) {
      result.passed = false;
      result.error = {
        message: 'Runtime Error',
        stack: error.message
      };
      result.executionTime = 0;
    }

    results.push(result);
  }

  return results;
}

// Run Python test cases
async function runPythonTestCases(executionDir, testCases) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testCaseNumber = i + 1;

    const result = {
      testCase: testCaseNumber,
      description: testCase.description || `Test case ${testCaseNumber}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput
    };

    try {
      // Start timing execution
      const startTime = process.hrtime();

      // Run Python program with the test case
      const output = await runPythonProgram(executionDir, testCase.input);

      // Calculate execution time
      const endTime = process.hrtime(startTime);
      const executionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds

      // Check if output matches expected output
      const normalizedOutput = output.trim();
      const normalizedExpected = testCase.expectedOutput.trim();
      const passed = normalizedOutput === normalizedExpected;

      result.passed = passed;
      result.yourOutput = normalizedOutput;
      result.executionTime = executionTime;
    } catch (error) {
      result.passed = false;
      result.error = {
        message: 'Runtime Error',
        stack: error.message
      };
      result.executionTime = 0;
    }

    results.push(result);
  }

  return results;
}

// Run Java program
function runJavaProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    const process = spawn('java', ['-Xmx256m', '-Xss64m', 'Solution'], {
      cwd: executionDir,
      timeout: EXECUTION_TIMEOUT
    });

    let stdout = '';
    let stderr = '';

    // Provide input if needed
    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Execution failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start execution process: ${err.message}`));
    });
  });
}

// Run Python program
function runPythonProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', ['solution.py'], {
      cwd: executionDir,
      timeout: EXECUTION_TIMEOUT
    });

    let stdout = '';
    let stderr = '';

    // Provide input if needed
    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python execution failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start Python execution process: ${err.message}`));
    });
  });
}

// Clean up directory
async function cleanupDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await cleanupDirectory(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }

    await fs.rmdir(dir);
  } catch (error) {
    console.error(`Error cleaning up directory ${dir}:`, error);
  }
}

module.exports = {
  initializeDirectories,
  executeCode,
  executeJavaCode,
  executePythonCode
};