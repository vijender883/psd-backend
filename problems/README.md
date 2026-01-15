# How to Add a New Problem

## 1. Naming Convention (Strict)

*   **File Name**: Must be **camelCase** (e.g., `twoSum.json`, `longestSubstring.json`).
*   **Problem ID**: The `id` field inside the JSON **must match the filename** (without extensions).
    *   File: `twoSum.json` -> ID: `"twoSum"`
    *   File: `minPathSum.json` -> ID: `"minPathSum"`

## 2. JSON Structure

Create a new JSON file in this directory with the following fields:

```json
{
  "id": "mustMatchFileName",
  "title": "Human Readable Title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "description": "Markdown supported description...",
  "constraints": [
    "Constraint 1",
    "Constraint 2"
  ],
  "hints": [
    "Optional hint 1",
    "Optional hint 2"
  ],
  "function_name": "exactNameOfFunction",
  "adapter_type": "standard" | "unordered-list",
  "template": "class Solution:\n    def exactNameOfFunction(self, arg1, arg2):\n        pass",
  "solution": "Full working solution code...",
  "test_cases": [
    {
      "input": [arg1, arg2],
      "output": expected_result,
      "is_hidden": boolean,
      "description": "Optional label"
    }
  ]
}
```

## 3. Field Details

*   **`function_name`**: This is **CRITICAL**. It tells the runner which method to call on the `Solution` class. It must match the method name defined in your `template`.
*   **`adapter_type`**:
    *   `"standard"`: Use for exact matches (integers, strings, booleans, specific arrays).
    *   `"unordered-list"`: Use when the output is a list where order implies no difference (e.g. `[0,1]` is same as `[1,0]`).
*   **`input` (in test_cases)**:
    *   Must be a **JSON Array** representing the arguments passed to the function.
    *   If function takes `(nums, target)`, input is `[[2,7,11,15], 9]`.
    *   If function takes `(s)`, input is `["hello"]`.

## 4. Example: `twoSum.json`

```json
{
  "id": "twoSum",
  "title": "Two Sum",
  "function_name": "twoSum",
  "adapter_type": "unordered-list",
  "test_cases": [
    {
      "input": [[2, 7, 11, 15], 9],
      "output": [0, 1]
    }
  ],
  ...
}
```
