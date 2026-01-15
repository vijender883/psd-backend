const mongoose = require("mongoose");
const axios = require("axios");
const dotenv = require("dotenv");
const Problem = require("../models/Problem");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const BASE_URL = "http://localhost:3001/api/problems";

async function verify() {
  console.log("Starting Problem Creation Verification...");

  // 1. Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }

  const testProblemId = `verify_create_${Date.now()}`;

  try {
    // 2. Call POST /api/problems
    console.log(`Testing POST ${BASE_URL} with ID: ${testProblemId}...`);

    // Check server first
    try {
      await axios.get("http://localhost:3001/health");
      console.log("✅ Server is running. Proceeding with API call.");

      const response = await axios.post(BASE_URL, {
        problemId: testProblemId,
        title: "Verification Create Problem",
        description: "Created via verification script",
        functionName: "verify_func",
        testCases: [{ input: "[]", expectedOutput: "0" }],
        inputFormat: "Any",
        outputFormat: "Any",
      });

      if (response.status === 201 && response.data.success) {
        console.log("✅ API returned success (HTTP 201)");
      } else {
        console.error("❌ API call failed:", response.data);
      }
    } catch (e) {
      if (e.message.includes("connect ECONNREFUSED")) {
        console.warn("⚠️ Server not reachable. Skipping API call check.");
        // Creating manually to simulate what API would do to verify model at least?
        // No, verification script should verify API.
        console.warn("⚠️ Cannot verify API route without running server.");
      } else {
        console.error(
          "❌ API Error:",
          e.response ? e.response.data : e.message
        );
      }
    }

    // 3. Verify in DB (even if API skipped, we can check if it exists if API ran successfully)
    // If API skipped, this will fail obviously.

    console.log("Checking Database for problem...");
    const problem = await Problem.findOne({ problemId: testProblemId });
    if (problem) {
      console.log("✅ Problem found in database!");
    } else {
      console.log(
        "ℹ️ Problem NOT found in database (Expected if server wasn't running)"
      );
    }
  } catch (err) {
    console.error("❌ Verification Error:", err);
  } finally {
    // Cleanup
    if (testProblemId) await Problem.deleteOne({ problemId: testProblemId });
    console.log("🧹 Cleanup complete");
    await mongoose.disconnect();
  }
}

verify();
