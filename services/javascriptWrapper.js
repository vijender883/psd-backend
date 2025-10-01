// services/javascriptWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generateJavaScriptWrapper(executionDir, code) {
    let wrapperCode;

    if (code.includes('function chunk')) {
        wrapperCode = generateArrayChunkWrapper(code);
    } else if (code.includes('function flattenObject')) {
        wrapperCode = generateFlattenObjectWrapper(code);
    } else if (code.includes('function removeNthFromEnd') || code.includes('removeNthFromEnd')) {
        wrapperCode = generateRemoveNthFromEndWrapper(code);
    } else {
        wrapperCode = generateFallbackWrapper(code); 
    }

    await fs.writeFile(path.join(executionDir, 'solution.js'), wrapperCode);
}

// --- Specific Wrapper Functions ---

/**
 * Wrapper for 'arraychunk' problem: chunk(array, size)
 * Input format: First line: JSON array (array), Second line: Integer (size)
 */

function generateRemoveNthFromEndWrapper(code) {
    return `
const readline = require('readline');

// Definition for singly-linked list
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

${code}

// Helper function to build linked list from array
function buildLinkedList(values) {
    if (!values || values.length === 0) {
        return null;
    }
    
    const dummy = new ListNode(0);
    let current = dummy;
    
    for (const val of values) {
        current.next = new ListNode(val);
        current = current.next;
    }
    
    return dummy.next;
}

// Helper function to convert linked list to array
function linkedListToArray(head) {
    const result = [];
    let current = head;
    
    while (current !== null) {
        result.push(current.val);
        current = current.next;
    }
    
    return result;
}

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
      throw new Error('Expected two lines of input: linked list values and n');
    }
    
    // Parse the linked list values (line 0)
    const values = lines[0].trim().split(' ').map(val => parseInt(val, 10));
    if (values.some(isNaN)) {
        throw new Error('Invalid integers provided for linked list');
    }
    
    // Parse n (line 1)
    const n = parseInt(lines[1].trim(), 10);
    if (isNaN(n)) {
        throw new Error('Invalid integer provided for n');
    }
    
    // Build linked list
    const head = buildLinkedList(values);
    
    // Call the user's function
    const result = removeNthFromEnd(head, n);
    
    // Convert result to array and output
    const resultArray = linkedListToArray(result);
    console.log(resultArray.join(' '));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
});
`;
}



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
