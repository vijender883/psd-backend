// services/javascriptWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generateJavaScriptWrapper(executionDir, code) {
    let wrapperCode;

    // Determine the problem by looking for unique function names
    if (code.includes('function chunk')) {
        wrapperCode = generateArrayChunkWrapper(code);
    } else if (code.includes('function flattenObject')) {
        wrapperCode = generateFlattenObjectWrapper(code);
    } 
    // Add more explicit checks for other problem types here if needed
    // The previous error was caused by calling an undefined function, 
    // so we must ensure a wrapper is generated for every possible problem ID.
    // For now, we only need to implement the wrappers for the problems provided in the prompt.
    
    else {
        // Fallback or handle cases detected by the previous logic if they existed
        // For the scope of the provided problems, one of the above should match.
        wrapperCode = generateFallbackWrapper(code); 
    }

    await fs.writeFile(path.join(executionDir, 'solution.js'), wrapperCode);
}

// --- Specific Wrapper Functions ---

/**
 * Wrapper for 'arraychunk' problem: chunk(array, size)
 * Input format: First line: JSON array (array), Second line: Integer (size)
 */
function generateArrayChunkWrapper(code) {
    return `
const readline = require('readline');

${code}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const lines = [];

rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  try {
    if (lines.length < 2) {
      throw new Error('Expected two lines of input: array and chunk size.');
    }
    
    // Parse the array (line 0)
    let array;
    try {
        array = JSON.parse(lines[0].trim());
    } catch (e) {
        throw new Error('Invalid JSON array provided for input 1.');
    }

    // Parse the chunk size (line 1)
    const size = parseInt(lines[1].trim(), 10);
    if (isNaN(size)) {
        throw new Error('Invalid integer provided for chunk size on input 2.');
    }
    
    // Call the user's function
    const result = chunk(array, size);
    
    // Output the result as a JSON string
    console.log(JSON.stringify(result));
  } catch (error) {
    // Console.error is caught by the execution environment as a runtime error
    console.error(error.message);
    process.exit(1);
  }
});
`;
}


/**
 * Wrapper for 'flattenobject' problem: flattenObject(obj)
 * Input format: Single line: JSON object
 */
function generateFlattenObjectWrapper(code) {
    return `
const readline = require('readline');

${code}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const lines = [];

rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  try {
    if (lines.length === 0) {
      throw new Error('Expected one line of input: JSON object.');
    }
    
    // Parse the object (line 0)
    let obj;
    try {
        obj = JSON.parse(lines[0].trim());
    } catch (e) {
        throw new Error('Invalid JSON object provided for input.');
    }
    
    // Call the user's function
    const result = flattenObject(obj);
    
    // Output the result as a JSON string
    // Note: JSON.stringify handles formatting for objects correctly
    console.log(JSON.stringify(result));
  } catch (error) {
    // Console.error is caught by the execution environment as a runtime error
    console.error(error.message);
    process.exit(1);
  }
});
`;
}


/**
 * Fallback wrapper for any unknown or simple one-argument functions.
 * This is primarily to avoid the ReferenceError.
 */
function generateFallbackWrapper(code) {
    // Attempt to dynamically find the function name for simple execution
    const functionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
    const functionName = functionMatch ? (functionMatch[1] || functionMatch[3] || 'solution') : 'solution';

    return `
const readline = require('readline');

${code}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const lines = [];

rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  try {
    if (lines.length === 0) {
        throw new Error('No input provided for fallback wrapper.');
    }
    
    // Try to parse the first line of input as a JSON array/object/primitive
    let inputArgs;
    try {
        // Attempt to parse line 0 as the single argument
        inputArgs = JSON.parse(lines[0].trim());
    } catch (e) {
        // If JSON fails, treat it as a raw string argument
        inputArgs = lines[0].trim();
    }

    // Call the function with the assumed single argument
    const result = ${functionName}(inputArgs);
    
    // Output the result as a JSON string
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Fallback Wrapper Error: ' + error.message);
    process.exit(1);
  }
});
`;
}

// Export the main function
module.exports = {
    generateJavaScriptWrapper
};
