// services/javascriptWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generateJavaScriptWrapper(executionDir, code, problemId = null) {
  let wrapperCode;

  if (problemId) {
    switch (problemId) {
      case 'target_difference':
        wrapperCode = generateTargetDifferenceWrapper(code);
        break;
      case 'arraychunk':
        wrapperCode = generateArrayChunkWrapper(code);
        break;
      case 'flattenobject':
        wrapperCode = generateFlattenObjectWrapper(code);
        break;
      case 'twosum':
      case 'two_sum':
        wrapperCode = generateTwoSumWrapper(code);
        break;
      case 'deletenthfromend':
      case 'removeNthFromEnd':
        wrapperCode = generateRemoveNthFromEndWrapper(code);
        break;
    }
  }

  if (!wrapperCode) {
    // Dynamic detection for legacy
    if (code.includes('function chunk')) {
      wrapperCode = generateArrayChunkWrapper(code);
    } else if (code.includes('function flattenObject')) {
      wrapperCode = generateFlattenObjectWrapper(code);
    } else if (code.includes('removeNthFromEnd')) {
      wrapperCode = generateRemoveNthFromEndWrapper(code);
    } else if (code.includes('twoSum') || code.includes('two_sum')) {
      wrapperCode = generateTwoSumWrapper(code);
    } else if (code.includes('targetDifference') || code.includes('target_difference')) {
      wrapperCode = generateTargetDifferenceWrapper(code);
    } else {
      wrapperCode = generateFallbackWrapper(code);
    }
  }

  await fs.writeFile(path.join(executionDir, 'solution.js'), wrapperCode);
}

function generateTwoSumWrapper(code) {
  return `
const readline = require('readline');
${code}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    try {
        if (lines.length < 2) throw new Error('Expected 2 lines');
        const nums = lines[0].trim().split(/\\s+/).map(Number);
        const target = Number(lines[1].trim());
        
        let result;
        const fn = (typeof twoSum === 'function') ? twoSum : (typeof two_sum === 'function' ? two_sum : null);
        if (fn) {
            result = fn(nums, target);
        } else if (typeof Solution === 'function') {
            const s = new Solution();
            const method = s.twoSum || s.two_sum;
            result = method.call(s, nums, target);
        }
        
        if (Array.isArray(result)) console.log(result.join(' '));
        else console.log("");
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
});
`;
}

function generateRemoveNthFromEndWrapper(code) {
  return `
const readline = require('readline');
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}
${code}

function buildLinkedList(values) {
    if (!values || values.length === 0) return null;
    const dummy = new ListNode(0);
    let current = dummy;
    for (const val of values) {
        current.next = new ListNode(val);
        current = current.next;
    }
    return dummy.next;
}

function linkedListToArray(head) {
    const result = [];
    let current = head;
    while (current !== null) {
        result.push(current.val);
        current = current.next;
    }
    return result;
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  try {
    if (lines.length < 2) throw new Error('Expected 2 lines');
    const values = lines[0].trim().split(/\\s+/).map(Number);
    const n = Number(lines[1].trim());
    const head = buildLinkedList(values);
    
    let result;
    const fn = (typeof removeNthFromEnd === 'function') ? removeNthFromEnd : null;
    if (fn) result = fn(head, n);
    else if (typeof Solution === 'function') {
        const s = new Solution();
        result = s.removeNthFromEnd(head, n);
    }
    
    console.log(linkedListToArray(result).join(' '));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
});
`;
}

function generateTargetDifferenceWrapper(code) {
  return `
const readline = require('readline');
${code}
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  try {
    if (lines.length < 2) throw new Error('Expected 2 lines');
    let nums;
    const line0 = lines[0].trim();
    if (line0.startsWith('[') && line0.endsWith(']')) nums = JSON.parse(line0);
    else nums = line0.split(/\\s+/).filter(x => x !== "").map(Number);
    const k = Number(lines[1].trim());
    
    let result;
    const fn = (typeof targetDifference === 'function') ? targetDifference : 
               (typeof target_difference === 'function') ? target_difference : null;
    if (!fn) {
        if (typeof Solution === 'function') {
            const s = new Solution();
            const m = s.targetDifference || s.target_difference;
            result = m.call(s, nums, k);
        } else throw new Error('Function not found');
    } else result = fn(nums, k);
    
    if (!result) console.log("");
    else if (typeof result === 'string') console.log(result.trim());
    else if (Array.isArray(result)) {
        if (result.length === 0) console.log("");
        else if (!Array.isArray(result[0])) console.log(result.join(' '));
        else {
            result.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
            console.log(result.flat().join(' '));
        }
    } else console.log(String(result));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});
`;
}

function generateArrayChunkWrapper(code) {
  return `
const readline = require('readline');
${code}
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  try {
    if (lines.length < 2) throw new Error('Expected 2 lines');
    const array = JSON.parse(lines[0].trim());
    const size = Number(lines[1].trim());
    const result = chunk(array, size);
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});
`;
}

function generateFlattenObjectWrapper(code) {
  return `
const readline = require('readline');
${code}
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  try {
    if (lines.length === 0) throw new Error('Expected input');
    const obj = JSON.parse(lines[0].trim());
    const result = flattenObject(obj);
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});
`;
}

function generateFallbackWrapper(code) {
  const match = code.match(/function\\s+(\\w+)|const\\s+(\\w+)\\s*=\\s*function/);
  const name = match ? (match[1] || match[2]) : 'solution';
  return `
const readline = require('readline');
${code}
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  try {
    if (lines.length === 0) throw new Error('No input');
    let args;
    try { args = JSON.parse(lines[0].trim()); }
    catch (e) { args = lines[0].trim(); }
    const res = (typeof ${name} === 'function') ? ${name}(args) : null;
    console.log(JSON.stringify(res));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});
`;
}

module.exports = { generateJavaScriptWrapper };
