const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BASE_DIR = '/tmp/code-runner';

// Initialize the execution directory
async function initializeDirectories() {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create base directory:', err);
  }
}

// Import the Java wrapper generator
const { generateJavaWrapper } = require('./javaWrapper');

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
    const results = await runTestCases(executionDir, testCases);
    
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
  // finally {
  //   // Cleanup in the background
  //   cleanupDirectory(executionDir).catch(err => 
  //     console.error(`Failed to clean up ${executionDir}:`, err)
  //   );
  // }
}

// Compile Java code
function compileJavaCode(executionDir) {
  return new Promise((resolve, reject) => {
    const process = spawn('javac', ['Solution.java'], {
      cwd: executionDir,
      timeout: 10000 // 10 second timeout for compilation
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

// Run test cases
async function runTestCases(executionDir, testCases) {
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

// Run Java program
function runJavaProgram(executionDir, input) {
  return new Promise((resolve, reject) => {
    const process = spawn('java', ['-Xmx256m', '-Xss64m', 'Solution'], {
      cwd: executionDir,
      timeout: 5000 // 5 second timeout
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
  executeJavaCode
};