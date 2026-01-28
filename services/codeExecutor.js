const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper for robust output comparison
const compareOutputs = (actual, expected) => {
  if (actual === expected) return true;
  if (actual == null || expected == null) return false;

  const normalize = (str) => {
    return str
      .toString()
      .trim()
      .replace(/[\r\n\t]+/g, ' ') // Replace newlines/tabs with space
      .replace(/\s{2,}/g, ' ')     // Collapse multiple spaces
      .trim();
  };

  return normalize(actual) === normalize(expected);
};

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
const { generateJavaScriptWrapper } = require('./javascriptWrapper');
const { executeApexCode } = require('./apexExecutor');

// Modify executeCode function
async function executeCode(code, testCases, language, problemId = null) {
  return executionQueue.enqueue(() => {
    if (language === 'python') {
      return executePythonCode(code, testCases, problemId);
    } else if (language === 'javascript') {
      return executeJavaScriptCode(code, testCases, problemId);
    } else if (language === 'apex') {
      return executeApexCode(code, testCases);
    } else {
      return executeJavaCode(code, testCases, problemId);
    }
  });
}

// Execute Java code
async function executeJavaCode(code, testCases, problemId = null) {
  const submissionId = uuidv4();
  const executionDir = path.join(BASE_DIR, submissionId);

  try {
    // Create execution directory
    await fs.mkdir(executionDir, { recursive: true });

    // Generate wrapped Java code
    await generateJavaWrapper(executionDir, code, problemId);

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
async function executePythonCode(code, testCases, problemId = null) {
  const submissionId = uuidv4();
  const executionDir = path.join(BASE_DIR, submissionId);

  try {
    // Create execution directory
    await fs.mkdir(executionDir, { recursive: true });

    // Generate wrapped Python code
    await generatePythonWrapper(executionDir, code, problemId);

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
        message: 'Compilation Error', // Change to match frontend expectation
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
    const child = spawn('javac', ['Main.java'], {
      cwd: executionDir,
      timeout: COMPILATION_TIMEOUT
    });

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Compilation failed: ${stderr}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
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
      const passed = compareOutputs(normalizedOutput, normalizedExpected);

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

      console.log('--- TEST CASE DEBUG ---');
      console.log(`Input: ${testCase.input}`);
      console.log(`Expected: '${normalizedExpected}'`);
      console.log(`Actual: '${normalizedOutput}'`);
      console.log(`Match: ${normalizedOutput === normalizedExpected}`);
      console.log('-----------------------');

      const passed = compareOutputs(normalizedOutput, normalizedExpected);

      result.passed = passed;
      result.yourOutput = normalizedOutput;
      result.executionTime = executionTime;
    } catch (error) {
      result.passed = false;
      result.error = {
        message: 'Runtime Error',
        stack: error.message
      };
      result.yourOutput = error.message; // Add this line to show error in output
      result.executionTime = 0;
    }

    results.push(result);
  }

  return results;
}

// Run Java program
function runJavaProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    const child = spawn('java', ['-Xmx256m', '-Xss64m', 'Main'], {
      cwd: executionDir,
      timeout: EXECUTION_TIMEOUT
    });

    let stdout = '';
    let stderr = '';

    // Provide input if needed
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Execution failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start execution process: ${err.message}`));
    });
  });
}

// Run Python program
function runPythonProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    // on Windows, try 'python' first, but if it's the Store shim, it might fail or print the "install" message.
    // If we detect that, we could try 'py'.
    // For now, let's default to 'python' but allow environment variable override
    const pythonCommand = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'py' : 'python3'); // Changed default to 'py' for win32
    console.log(`[Python Executor] Using command: ${pythonCommand}`);

    const child = spawn(pythonCommand, ['solution.py'], {
      cwd: executionDir,
      timeout: EXECUTION_TIMEOUT
    });

    let stdout = '';
    let stderr = '';

    // Provide input if needed
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        // Format the stderr to show actual Python error
        const errorMessage = stderr.trim() || `Python execution failed with exit code ${code}`;
        reject(new Error(errorMessage));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
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




// Add new function
async function executeJavaScriptCode(code, testCases, problemId = null) {
  const submissionId = uuidv4();
  const executionDir = path.join(BASE_DIR, submissionId);

  try {
    await fs.mkdir(executionDir, { recursive: true });
    await generateJavaScriptWrapper(executionDir, code, problemId);
    const results = await runJavaScriptTestCases(executionDir, testCases);

    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error(`JavaScript execution error for ${submissionId}:`, error);
    return {
      success: false,
      error: {
        message: 'Execution Error',
        stack: error.message
      }
    };
  } finally {
    setTimeout(() => {
      cleanupDirectory(executionDir).catch(err =>
        console.error(`Failed to clean up directory ${executionDir}: ${err.message}`)
      );
    }, 1000);
  }
}

async function runJavaScriptTestCases(executionDir, testCases) {
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
      const startTime = process.hrtime();
      const output = await runJavaScriptProgram(executionDir, testCase.input);
      const endTime = process.hrtime(startTime);
      const executionTime = endTime[0] * 1000 + endTime[1] / 1000000;

      const normalizedOutput = output.trim();
      const normalizedExpected = testCase.expectedOutput.trim();
      const passed = compareOutputs(normalizedOutput, normalizedExpected);

      result.passed = passed;
      result.yourOutput = normalizedOutput;
      result.executionTime = executionTime;
    } catch (error) {
      result.passed = false;
      result.error = {
        message: 'Runtime Error',
        stack: error.message
      };
      result.yourOutput = error.message;
      result.executionTime = 0;
    }

    results.push(result);
  }

  return results;
}

function runJavaScriptProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['solution.js'], {
      cwd: executionDir,
      timeout: EXECUTION_TIMEOUT
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // --- CONSOLIDATED INPUT HANDLING (FIX APPLIED HERE) ---
    if (input) {
      // DEBUG LOGGING START
      console.log(`[JS EXEC] Original Input: "${input.replace(/\n/g, '\\n')}"`);
      console.log(`[JS EXEC] OS EOL: "${os.EOL.replace(/\n/g, '\\n')}"`);

      // We assume the test case input from the problem structure (e.g., '[1, 2, 3]\n2')
      // uses the literal characters \n to denote a line break, so we replace the
      // two characters '\\n' with the actual OS EOL character.
      const sanitizedInput = input.replace(/\\n/g, os.EOL); // Use os.EOL

      console.log(`[JS EXEC] Sanitized Input (literal \\n replacement): "${sanitizedInput.replace(/\n/g, '\\n')}"`);
      // DEBUG LOGGING END

      // **MANDATORY: Write the input ONCE**
      child.stdin.write(sanitizedInput);
      child.stdin.end();
    }
    // --- END CONSOLIDATED INPUT HANDLING ---

    child.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = stderr.trim() || `JavaScript execution failed with exit code ${code}`;
        reject(new Error(errorMessage));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start JavaScript execution process: ${err.message}`));
    });
  });
}

module.exports = {
  initializeDirectories,
  executeCode,
  executeJavaCode,
  executePythonCode,
  executeJavaScriptCode,
  executeApexCode
};