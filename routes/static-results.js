const express = require('express');

// Static test results that will be returned for every submission
const STATIC_RESULTS = {
    success: true,
    results: [
        {
            testCase: 1,
            description: "Basic array with positive integers",
            input: "[64, 34, 25, 12, 22, 11, 90]",
            expectedOutput: 11,
            yourOutput: 11,
            passed: true,
            executionTime: 0.156
        },
        {
            testCase: 2,
            description: "Array with negative integers",
            input: "[-5, -2, -10, -1, -8]",
            expectedOutput: -10,
            yourOutput: -10,
            passed: true,
            executionTime: 0.134
        },
        {
            testCase: 3,
            description: "Single element array",
            input: "[1]",
            expectedOutput: 1,
            yourOutput: 1,
            passed: true,
            executionTime: 0.089
        },
        {
            testCase: 4,
            description: "Array with identical elements",
            input: "[5, 5, 5, 5, 5]",
            expectedOutput: 5,
            yourOutput: 5,
            passed: true,
            executionTime: 0.112
        },
        {
            testCase: 5,
            description: "Array with large values",
            input: "[999999, -999999, 0]",
            expectedOutput: -999999,
            yourOutput: -999999,
            passed: true,
            executionTime: 0.145
        }
    ],
    summary: {
        totalTests: 5,
        passedTests: 5,
        averageExecutionTime: 0.127
    },
    error: null
};

module.exports = STATIC_RESULTS;