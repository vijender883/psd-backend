# Summary & Implementation Guide

## Goal

Build a **LeetCode-style code editor platform** with:
- Easy insertion of new problems (description, test cases, function template)
- Dynamic common testing function that works for all problems
- Automatic input parsing and output validation
- Score tracking and result storage

---

## Approach

**Hybrid architecture** combining:
- **Node.js backend** - API, authentication, database operations
- **Python test runner** - Code execution and validation
- **JSON-based communication** - Node spawns Python subprocess, exchanges data via JSON
- **File-based problem storage** - Problems and adapters stored as files in repo (not just database)

---

## Complete Implementation Strategy

### 1. **File Structure**

```
project/
├── backend/ (Node.js)
│   ├── api/
│   │   └── submit.js              # Handles code submissions
│   └── executePython.js           # Spawns Python runner
│
├── problems/                       # Problem definitions
│   ├── 1-two-sum.json
│   ├── 2-add-two-numbers.json
│   └── ...
│
├── adapters/                       # Validation strategies
│   ├── standard.py                # Exact match
│   ├── unordered-list.py          # Order-agnostic
│   ├── multi-answer.py            # Multiple valid answers
│   └── custom/
│       └── tree-validator.py      # Problem-specific
│
└── test-runner/
    └── runner.py                  # Main Python test executor
```

### 2. **Problem Definition (JSON)**

Each problem is a JSON file with:

```json
{
  "id": 1,
  "title": "Two Sum",
  "difficulty": "Easy",
  "description": "Given an array...",
  "function_name": "twoSum",
  "adapter_type": "standard",
  "template": "class Solution:\n    def twoSum(self, nums, target):\n        pass",
  "test_cases": [
    {
      "input": [[2, 7, 11, 15], 9],
      "output": [0, 1],
      "is_hidden": false
    }
  ]
}
```

**Adding new problems**: Just create a new JSON file.

### 3. **Adapter System (Python)**

Each adapter is a Python file with a `validate()` method:

```python
# adapters/standard.py
class Adapter:
    def validate(self, actual, expected):
        return actual == expected

# adapters/unordered-list.py
class Adapter:
    def validate(self, actual, expected):
        return sorted(actual) == sorted(expected)
```

**Problem references adapter by type**: `"adapter_type": "standard"`

### 4. **Node.js Execution Flow**

```javascript
// POST /api/submit
async function handleSubmission(userCode, problemId) {
  // 1. Load problem JSON from file
  const problem = JSON.parse(
    fs.readFileSync(`./problems/${problemId}.json`)
  );
  
  // 2. Create payload
  const payload = {
    user_code: userCode,
    problem_config: problem
  };
  
  // 3. Write to temp file
  const payloadPath = `/tmp/payload-${Date.now()}.json`;
  fs.writeFileSync(payloadPath, JSON.stringify(payload));
  
  // 4. Spawn Python runner
  const python = spawn('python3', [
    './test-runner/runner.py',
    payloadPath
  ]);
  
  // 5. Capture stdout (JSON results)
  let output = '';
  python.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  // 6. Parse results when done
  python.on('close', () => {
    const results = JSON.parse(output);
    
    // 7. Save to database
    saveSubmission(problemId, userCode, results);
    
    // 8. Return to user
    return results;
  });
  
  // 9. Cleanup
  fs.unlinkSync(payloadPath);
}
```

### 5. **Python Test Runner**

```python
# runner.py
import sys
import json

def run_tests(payload):
    user_code = payload['user_code']
    problem = payload['problem_config']
    
    # Execute user code to get Solution class
    namespace = {}
    exec(user_code, namespace)
    solution = namespace['Solution']()
    
    # Load adapter
    adapter = load_adapter(problem['adapter_type'])
    
    # Run each test case
    results = []
    for test_case in problem['test_cases']:
        # Get function by name
        func = getattr(solution, problem['function_name'])
        
        # Call with inputs
        actual = func(*test_case['input'])
        expected = test_case['output']
        
        # Validate using adapter
        passed = adapter.validate(actual, expected)
        
        results.append({
            'passed': passed,
            'actual': actual,
            'expected': expected
        })
    
    # Calculate score
    score = sum(1 for r in results if r['passed'])
    
    return {
        'status': 'success',
        'score': score,
        'total': len(results),
        'results': results
    }

# Main execution
payload = json.load(open(sys.argv[1]))
result = run_tests(payload)
print(json.dumps(result))  # Node captures this
```

### 6. **Input Parsing & Output Validation**

**How inputs flow:**
```
Database/JSON → Python list → Function parameters
```

Example:
```json
"input": [[2, 7, 11, 15], 9]
```
Becomes:
```python
func([2, 7, 11, 15], 9)  # Two separate arguments
```

**No parsing needed** - JSON automatically converts to Python types.

**How validation works:**
```
actual_output → adapter.validate(actual, expected) → True/False
```

Different adapters for different validation needs.

### 7. **Database Schema (MongoDB)**

```javascript
// submissions collection
{
  _id: ObjectId,
  user_id: ObjectId,
  problem_id: 1,
  user_code: "class Solution...",
  status: "success",
  score: 2,
  total_tests: 2,
  results: [...],
  submitted_at: Date
}

// users collection  
{
  _id: ObjectId,
  username: "vijender",
  total_submissions: 45,
  problems_solved: 12,
  solved_problems: [1, 2, 5, ...]
}
```

---

## Key Technical Decisions

1. **Function parameter passing** (not stdin/stdout)
   - Natural Python calling
   - Type safe
   - Easy debugging

2. **exec() for code execution**
   - Simple and fast
   - Isolated namespace
   - Later: wrap in Docker for production

3. **Adapter pattern for validation**
   - Flexible per-problem
   - Reusable across problems
   - Easy to add custom validators

4. **JSON everywhere**
   - Node → Python: JSON file
   - Python → Node: JSON stdout
   - Database storage: JSON fields
   - No parsing complexity

5. **Files over database**
   - Version control for problems
   - Easy editing and review
   - Simple deployment

---

## Implementation Steps

1. ✅ Create folder structure
2. ✅ Write 2-3 sample problem JSONs
3. ✅ Write standard adapter
4. ✅ Build Python runner.py (core logic)
5. ✅ Build Node executePython.js (subprocess handler)
6. ✅ Create submit API endpoint
7. ✅ Test with sample submission
8. ✅ Add database saving
9. ✅ Add more adapters as needed
10. ✅ Build frontend code editor

---

## Security & Scaling (Future)

**Current approach works for:**
- Development/testing
- Small user base
- Controlled environment

**When you scale, add:**
- Docker containers for isolation
- Resource limits (CPU, memory, time)
- Queue system (Redis/RabbitMQ) for async execution
- Rate limiting
- Code sanitization

---

## Summary

**You're building**: A dynamic code testing platform where problems are data (JSON), validation logic is pluggable (adapters), and execution is clean (Node spawns Python, exchanges JSON).

**Why this works**: Simple architecture, easy to maintain, easy to add problems, scalable foundation.

**Next step**: Start with runner.py - it's the heart of the system.