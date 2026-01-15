# Understanding the New Execution Approach & Data Model

This document outlines the architecture described in `docs/approach.md` and the unified data model designed to support it.

## Core Concept: Decoupled, Data-Driven Execution

The approach moves away from hardcoding problem logic (wrappers, parsers) in the backend and towards a generic, data-driven system where the **Problem Definition (JSON)** drives the execution.

### Key Components

1.  **Generic Test Runner (`runner.py`)**:
    *   A single, static Python script.
    *   Accepts a **JSON payload** containing user code and the full problem definition.
    *   Uses Python's dynamic `exec()` to run user code and `getattr()` to find the entry point defined by `function_name`.
    *   **Crucial Change**: Use of `*args` expansion. Inputs are stored as arrays `[arg1, arg2]`, allowing the runner to call `func(*inputs)` without knowing the specific signature.

2.  **Adapter Pattern for Validation**:
    *   Validation is offloaded to "adapters" specified by the `adapter_type` field (e.g., `unordered-list`, `standard`).
    *   This eliminates hardcoded validation logic in the runner.

3.  **Smart Data Model**:
    *   The problem JSON is the source of truth.
    *   **Native Types**: Inputs are stored as actual JSON arrays/numbers, not string representations (e.g., `[[2,7], 9]` vs `"2 7\n9"`). This removes the need for input parsing logic in the backend.

### Data Flow

1.  **Submission**: User checks code. Node.js backend retrieves the problem JSON.
2.  **Payload Construction**: Node creates a payload combining `user_code` and the `problem` object.
3.  **Execution**: Node spawns `python3 runner.py payload.json`.
4.  **Dynamic Invocation**:
    *   Runner loads `Solution` class from user code.
    *   Runner calls `getattr(instance, problem['function_name'])`.
    *   Runner passes arguments: `result = method(*test_case['input'])`.
5.  **Validation**: Runner uses the specified `adapter` to compare `result` vs `test_case['output']`.
6.  **Response**: Runner prints JSON results to stdout for Node to parse.

## The Unified Problem Model

The system relies on a standardized JSON structure for all problems.

**Key Design Decisions:**
*   **Encapsulation**: Code must run within a `class Solution`.
*   **Explicit Entry Point**: `function_name` tells the runner exactly what to call.
*   **Primitive Inputs**: `test_cases` use JSON Arrays for inputs, mapping 1:1 to function arguments.
    *   *Example*: `def func(a, b)` expects input `[val_a, val_b]`.
*   **Simplified Schema**: Fields like `inputFormat` are removed as they are obsolete with JSON-typed inputs.

### Example: Two Sum
```json
{
  "function_name": "twoSum",
  "adapter_type": "unordered-list",
  "test_cases": [
    {
      "input": [[2, 7, 11, 15], 9],
      "output": [0, 1]
    }
  ]
}
```
*   **Execution**: `twoSum([2, 7, 11, 15], 9)`
*   **Validation**: check if `sorted(actual) == sorted(expected)` (via `unordered-list` adapter).

## Benefits

*   **Zero Parsing Logic**: The backend no longer needs to know how to split strings or parse lines. JSON handles the data structure.
*   **Universal Runner**: The exact same `runner.py` works for potentially 99% of algorithmic problems without modification.
*   **Rich Metadata**: Fields like `hints` and explicit `difficulty` improve the user experience without affecting execution.
