const { executeCode } = require("../services/codeExecutor");
const path = require("path");
const fs = require("fs");

async function testRunner() {
  console.log("Starting Manual Verification of Generic Runner...");

  // 1. Valid Solution
  const validCode = `
class Solution:
    def twoSum(self, nums, target):
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i
        return []
`;

  console.log("\n--- Test 1: Valid Solution ---");
  const result1 = await executeCode(validCode, [], "python", "two-sum"); // Pass 'two-sum' as problemId
  console.log("Success:", result1.success);
  if (result1.results) {
    console.log(
      `Passed: ${result1.results.filter((r) => r.passed).length}/${
        result1.results.length
      }`
    );
  } else {
    console.log("Error:", result1.error);
  }

  // 2. Incorrect Solution
  const invalidCode = `
class Solution:
    def twoSum(self, nums, target):
        return [0, 0] # Always wrong
`;

  console.log("\n--- Test 2: Invalid Solution ---");
  const result2 = await executeCode(invalidCode, [], "python", "two-sum");
  console.log("Success:", result2.success);
  if (result2.results) {
    const passed = result2.results.filter((r) => r.passed).length;
    console.log(`Passed: ${passed}/${result2.results.length}`);
  }

  // 3. Syntax Error
  const syntaxErrorCode = `
class Solution:
    def twoSum(self, nums, target) # Missing colon
        pass
`;
  console.log("\n--- Test 3: Syntax Error ---");
  const result3 = await executeCode(syntaxErrorCode, [], "python", "two-sum");
  console.log("Success:", result3.success); // Should be false or contain error info
  console.log(
    "Result:",
    result3.error || "No generic error, logic error caught in results"
  );
  if (result3.results && result3.results.length === 0) {
    console.log("Correctly caught syntax error preventing execution.");
  }
}

testRunner().catch(console.error);
