const axios = require("axios");

// Token cache
let tokenCache = {
  accessToken: null,
  instanceUrl: null,
  expiresAt: 0,
};

// Get Salesforce access token
async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 300000) {
    return tokenCache;
  }

  try {
    console.log("Authenticating with Salesforce...");

    const response = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      null,
      {
        params: {
          grant_type: "password",
          client_id: process.env.SF_CLIENT_ID,
          client_secret: process.env.SF_CLIENT_SECRET,
          username: process.env.SF_USERNAME,
          password: process.env.SF_PASSWORD,
        },
      }
    );

    tokenCache = {
      accessToken: response.data.access_token,
      instanceUrl: response.data.instance_url,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    console.log("Salesforce authentication successful!");
    return tokenCache;
  } catch (error) {
    console.error(
      "Salesforce authentication failed:",
      error.response?.data || error.message
    );
    throw new Error(
      `Salesforce authentication failed: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
}

// Execute Apex code with test cases
async function executeApexCode(code, testCases) {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testCaseNumber = i + 1;

    const result = {
      testCase: testCaseNumber,
      description: testCase.description || `Test case ${testCaseNumber}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    };

    try {
      const startTime = process.hrtime();

      // Execute the Apex code directly
      const output = await executeApexAnonymous(code);

      const endTime = process.hrtime(startTime);
      const executionTime = endTime[0] * 1000 + endTime[1] / 1000000;

      const normalizedOutput = output.trim();
      const normalizedExpected = testCase.expectedOutput.trim();
      const passed = normalizedOutput === normalizedExpected;

      result.passed = passed;
      result.yourOutput = normalizedOutput;
      result.executionTime = executionTime;
    } catch (error) {
      result.passed = false;
      result.error = {
        message: error.compileProblem ? "Compilation Error" : "Runtime Error",
        stack: error.message,
      };
      result.yourOutput = error.message;
      result.executionTime = 0;
    }

    results.push(result);
  }

  return {
    success: true,
    results: results,
  };
}

// Execute anonymous Apex
async function executeApexAnonymous(code) {
  try {
    const { accessToken, instanceUrl } = await getAccessToken();

    console.log("Executing Apex code...");

    const response = await axios.get(
      `${instanceUrl}/services/data/v59.0/tooling/executeAnonymous`,
      {
        params: { anonymousBody: code },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const result = response.data;

    // Check for compilation errors
    if (!result.compiled) {
      const error = new Error(result.compileProblem || "Compilation failed");
      error.compileProblem = true;
      throw error;
    }

    // Check for execution errors
    if (!result.success) {
      throw new Error(result.exceptionMessage || "Execution failed");
    }

    // Extract debug logs to get output
    return extractOutputFromLogs(result.logs);
  } catch (error) {
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// Extract output from debug logs
function extractOutputFromLogs(logs) {
  if (!logs) return "";

  // Parse Salesforce logs to extract System.debug output
  const debugPattern = /USER_DEBUG\|.*?\|DEBUG\|(.*?)$/gm;
  const matches = [...logs.matchAll(debugPattern)];

  return matches.map((match) => match[1].trim()).join("\n");
}

module.exports = {
  executeApexCode,
  getAccessToken,
};
