# Implementation Plan

This document details how to implement the generic test runner and the new problem data model within the `psd-backend`.

## 1. Directory Structure

Create directories for the runner and its dependencies.

```text
psd-backend/
├── test-runner/
│   ├── runner.py          # Generic executor receiving JSON payload
│   └── utils.py           # Optional helper for loading modules
├── adapters/
│   ├── __init__.py
│   ├── standard.py        # Default: actual == expected
│   └── unordered_list.py  # Sorts both sides before comparing
└── ...
```

## 2. Database Model Update (`models/Problem.js`)

We must update the Mongoose schema to match the new JSON structure.

**Key Changes:**
*   `input` in `testCases` must be `Mixed` or `Array` to support the argument list `[arg1, arg2]`.
*   Add `functionName`, `adapterType`.
*   Remove `inputFormat`, `outputFormat`.

```javascript
const mongoose = require("mongoose");

const TestCaseSchema = new mongoose.Schema({
  // changed from String to Array/Mixed to hold actual argument values
  input: { type: mongoose.Schema.Types.Mixed, required: true }, 
  output: { type: mongoose.Schema.Types.Mixed, required: true },
  is_hidden: { type: Boolean, default: false },
  description: { type: String, default: "" }
}, { _id: false });

const ProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    
    // Core Execution Config
    functionName: { type: String, required: true }, // e.g. "twoSum"
    adapterType: { type: String, default: "standard" }, // e.g. "unordered-list"
    
    template: { type: String, required: true }, // Starter code
    solution: { type: String }, // Reference solution
    
    testCases: [TestCaseSchema],
    
    constraints: [String],
    hints: [String],
    
    // Optional metadata
    timeComplexity: String,
    spaceComplexity: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", ProblemSchema);
```

## 3. Python Runner (`test-runner/runner.py`)

The runner acts as the bridge. It must:
1.  Load the payload (Problem JSON + User Code).
2.  Execute User Code (`exec`).
3.  Inject arguments (`*args`).

**Draft Logic:**
```python
import sys, json
from importlib import import_module

def load_adapter(name):
    try:
        # Assumes adapters are in a package/folder named 'adapters'
        return import_module(f"adapters.{name.replace('-', '_')}")
    except ImportError:
        return import_module("adapters.standard")

def run():
    payload_path = sys.argv[1]
    with open(payload_path) as f:
        data = json.load(f)

    user_code = data['user_code']
    problem = data['problem']
    
    # 1. Load User Code
    namespace = {}
    try:
        exec(user_code, namespace)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        return

    SolutionClass = namespace.get('Solution')
    if not SolutionClass:
        # Handle error: Class 'Solution' not found
        pass
        
    solver = SolutionClass()
    func = getattr(solver, problem['function_name'])
    
    adapter_module = load_adapter(problem.get('adapter_type', 'standard'))
    
    results = []
    
    # 2. Execute Tests
    for tc in problem['test_cases']:
        inputs = tc['input'] # Expecting list: [arg1, arg2]
        expected = tc['output']
        
        try:
            # Expand arguments dynamically
            actual = func(*inputs)
            
            # 3. Validate
            if hasattr(adapter_module, 'validate'):
                passed = adapter_module.validate(actual, expected)
            else:
                 # Default fallback
                 passed = actual == expected
                 
            results.append({
                "passed": passed,
                "input": inputs,
                "expected": expected,
                "actual": actual
            })
        except Exception as e:
             results.append({"passed": False, "error": str(e)})

    # 4. Output
    print(json.dumps({"status": "success", "results": results}))

if __name__ == "__main__":
    run()
```

## 4. Service Layer (`services/codeExecutor.js`)

Refactor `executePythonCode` to:
1.  Accept the `problem` object (fetched from DB).
2.  Construct the payload.
3.  Spawn the runner.

```javascript
/* Payload Structure */
const payload = {
    user_code: code,
    problem: {
        function_name: problem.functionName,
        adapter_type: problem.adapterType,
        test_cases: problem.testCases.map(tc => ({
            input: tc.input,   // Already a JS array/object from DB
            output: tc.output
        }))
    }
};
// Write payload -> Spawn runner -> Read result
```

## 5. Migration Steps

1.  **Refactor DB Schema**: Update `models/Problem.js`.
2.  **Create Adapters**: Add `adapters/standard.py` and `adapters/unordered_list.py`.
3.  **Create Runner**: Implement `test-runner/runner.py`.
4.  **Update Routes**: `routes/code-execution.js` needs to fetch the full problem object (including `functionName`) and pass it to `executeCode`.
5.  **Update Service**: `services/codeExecutor.js` to write the JSON payload and call the new runner.
