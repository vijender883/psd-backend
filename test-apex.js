require("dotenv").config();
const { executeApexCode } = require("./services/apexExecutor");

async function testApex() {
  const testCode = `
System.debug('Hello from Apex!');
Integer a = 5;
Integer b = 3;
Integer result = a + b;
System.debug('Result: ' + result);
List<Integer> numbers = new List<Integer>{1, 2, 3, 4, 5};
System.debug('Numbers: ' + numbers);
  `.trim();

  // For Apex, we execute the code directly without wrappers for now
  const testCases = [
    {
      input: "", // Empty for simple debug test
      expectedOutput: "Hello from Apex!\nResult: 8\nNumbers: (1, 2, 3, 4, 5)",
      description: "Basic Apex test",
    },
  ];

  try {
    console.log("Testing Apex code execution...\n");
    console.log("Code to execute:");
    console.log(testCode);
    console.log("\n---\n");

    const result = await executeApexCode(testCode, testCases);
    console.log("Execution Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ Code executed successfully!");
    } else {
      console.log("\n❌ Code execution failed");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testApex();
