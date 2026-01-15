const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Problem = require("../models/Problem");
const Simulation = require("../models/Simulation");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const problemsData = [
  {
    problemId: "threesum",
    title: "3Sum",
    description:
      "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that:\n i != j, i != k, and j != k,\n nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.",
    inputFormat:
      "A single line containing space-separated integers representing the array nums.",
    outputFormat:
      "Return all unique triplets that sum to zero as a list of lists. Each triplet should be sorted in ascending order.",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    className: "ThreeSum",
    functionName: "three_sum",
    testCases: [
      {
        input: "-1 0 1 2 -1 -4",
        expectedOutput: "[[-1,-1,2],[-1,0,1]]",
        description: "Example test case 1 - multiple triplets found",
      },
      {
        input: "0 1 1",
        expectedOutput: "[]",
        description: "Example test case 2 - no triplets sum to zero",
      },
      {
        input: "0 0 0",
        expectedOutput: "[[0,0,0]]",
        description: "All zeros case",
      },
      {
        input: "-1 0 1",
        expectedOutput: "[[-1,0,1]]",
        description: "Simple case with one triplet",
      },
      {
        input: "1 2 3",
        expectedOutput: "[]",
        description: "All positive numbers - no solution",
      },
      {
        input: "-1 -2 -3",
        expectedOutput: "[]",
        description: "All negative numbers - no solution",
      },
      {
        input: "-2 0 1 1 2",
        expectedOutput: "[[-2,0,2],[-2,1,1]]",
        description: "Multiple valid triplets with duplicates",
      },
      {
        input: "-1 0 1 2 -1 -4 -2 -3 3 0 4",
        expectedOutput:
          "[[-4,0,4],[-4,1,3],[-3,-1,4],[-3,0,3],[-3,1,2],[-2,-1,3],[-2,0,2],[-1,-1,2],[-1,0,1]]",
        description: "Large array with many possible triplets",
      },
      {
        input: "3 0 -2 -1 1 2",
        expectedOutput: "[[-2,-1,3],[-2,0,2],[-1,0,1]]",
        description: "Mixed positive and negative numbers",
      },
      {
        input: "0 0 0 0",
        expectedOutput: "[[0,0,0]]",
        description: "Multiple zeros - should return only one triplet",
      },
    ],
  },
  {
    problemId: "validanagram",
    title: "Valid Anagram",
    description:
      "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.",
    inputFormat:
      "Two lines containing strings s and t, each consisting of lowercase English letters.",
    outputFormat: "Return true if t is an anagram of s, or false otherwise.",
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters",
    ],
    className: "ValidAnagram",
    functionName: "is_anagram",
    testCases: [
      {
        input: "anagram\nnagaram",
        expectedOutput: "true",
        description: "Example test case 1 - valid anagram",
      },
      {
        input: "rat\ncar",
        expectedOutput: "false",
        description: "Example test case 2 - not an anagram",
      },
      {
        input: "listen\nsilent",
        expectedOutput: "true",
        description: "Classic anagram pair",
      },
      {
        input: "evil\nvile",
        expectedOutput: "true",
        description: "Another valid anagram",
      },
      {
        input: "a\nab",
        expectedOutput: "false",
        description: "Different lengths",
      },
      {
        input: "ab\nba",
        expectedOutput: "true",
        description: "Simple two character anagram",
      },
      {
        input: "aab\naba",
        expectedOutput: "true",
        description: "Anagram with repeated characters",
      },
      {
        input: "abc\ndef",
        expectedOutput: "false",
        description: "Completely different characters",
      },
    ],
  },
];

const simulationData = {
  simulationId: "sim_dsa_practice_01",
  title: "DSA Practice: Arrays & Strings",
  description:
    "Practice session focusing on common Array pattern (Two Pointers) and String manipulation (Anagrams).",
  problemIds: ["threesum", "validanagram"],
  testsId: {
    mcqTests: [],
    dsaTests: ["threesum", "validanagram"], // Backward compatibility
  },
  scheduled_start_time: new Date(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  participationIds: [],
};

async function seed() {
  console.log("Starting Data Seeding...");

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Seed Problems
    for (const data of problemsData) {
      // Upsert problem (update if exists, insert if not)
      const result = await Problem.findOneAndUpdate(
        { problemId: data.problemId },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Seeded Problem: ${result.title} (${result.problemId})`);
    }

    // 2. Seed Simulation
    const result = await Simulation.findOneAndUpdate(
      { simulationId: simulationData.simulationId },
      simulationData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(
      `✅ Seeded Simulation: ${result.title} (${result.simulationId})`
    );
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected");
  }
}

seed();
