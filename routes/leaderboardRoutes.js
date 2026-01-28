// routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const Submission = require('../models/Submission');
const SimulationParticipant = require('../models/SimulationParticipant');
const Simulation = require('../models/Simulation');
const QuizAttempt = require('../models/QuizAttempt');

// Constants for score weighting
const MCQ_WEIGHT = 0.3;  // 30% weight for MCQ scores
const DSA_WEIGHT = 0.7;  // 70% weight for DSA scores

// Helper function to calculate MCQ score from a quiz attempt
async function calculateMcqScore(attemptId) {
  try {
    if (!attemptId) return 0;
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) return 0;
    return attempt.score || 0;
  } catch (error) {
    console.error('Error calculating MCQ score:', error);
    return 0;
  }
}

async function areResultsAvailable(simulationId) {
  try {
    const simulation = await Simulation.findOne({ simulationId });
    if (!simulation) return true;
    return simulation.areResultsAvailable();
  } catch (error) {
    return true;
  }
}

// Helper function to get problems for a simulation
async function getProblemsForSimulation(simulationId) {
  try {
    if (!simulationId) return [];
    const simulation = await Simulation.findOne({ simulationId: simulationId.toString() });
    const problemIds = simulation?.testsId?.dsaTests || simulation?.dsa_questions?.map(q => q.id) || [];
    return problemIds;
  } catch (error) {
    return [];
  }
}

// Calculate weighted total score
function calculateWeightedTotalScore(mcqScore, dsaScore) {
  return (mcqScore * MCQ_WEIGHT) + (dsaScore * DSA_WEIGHT);
}

// Internal function to update a single user's leaderboard entry
async function updateSingleUserLeaderboard(userId, simulationId, usernameHint = null) {
  try {
    const problemIds = await getProblemsForSimulation(simulationId);

    // Get DSA submissions
    const dsaSubmissions = await Submission.find({
      userId: userId.trim(),
      problemId: { $in: problemIds }
    });

    const dsaScores = {};
    let totalDsaScore = 0;
    let totalTimeTaken = 0;
    let totalPassedTests = 0;
    let totalTestsCount = 0;

    for (const submission of dsaSubmissions) {
      const score = submission.totalTests > 0 ? Math.round((submission.passedTests / submission.totalTests) * 100) : 0;
      dsaScores[submission.problemId] = score;
      totalDsaScore += score;
      totalTimeTaken += (submission.timeTaken || 0);
      totalPassedTests += (submission.passedTests || 0);
      totalTestsCount += (submission.totalTests || 0);
    }

    // Fallback to participant data for MCQ
    const participant = await SimulationParticipant.findOne({ userId, simulationId });
    let mcqScore = 0;
    if (participant?.mcqAttemptId) {
      mcqScore = await calculateMcqScore(participant.mcqAttemptId);
    }

    // Prioritize the explicitly provided username (e.g. from the current active session)
    // Then fallback to the most recent submission's username
    // Finally fallback to a generic user ID string if all else fails
    let finalUsername = usernameHint;

    if (!finalUsername && dsaSubmissions.length > 0) {
      // Sort submissions by date descending to get the very latest username used
      dsaSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      finalUsername = dsaSubmissions[0].username;
    }

    if (!finalUsername) {
      finalUsername = "User_" + userId.substring(0, 6);
    }
    let finalCollege = participant?.college || 'Not specified';
    const totalScore = calculateWeightedTotalScore(mcqScore, totalDsaScore);

    const lastSubmissionTime = dsaSubmissions.length > 0
      ? Math.max(...dsaSubmissions.map(s => new Date(s.createdAt).getTime()))
      : (participant?.updatedAt?.getTime() || new Date().getTime());

    return await Leaderboard.findOneAndUpdate(
      { userId, simulationId },
      {
        username: finalUsername,
        college: finalCollege,
        mcqScore,
        dsaScores,
        totalScore,
        totalPassedTests,
        totalTestsCount,
        totalTimeTaken,
        lastSubmissionTime: new Date(lastSubmissionTime)
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`Failed to update leaderboard for ${userId}:`, err);
    return null;
  }
}

// Endpoint to update leaderboard for a user
router.post('/simulations/:simulationId/leaderboard/update', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { userId, username } = req.body;
    if (!userId || !simulationId) return res.status(400).json({ success: false, error: 'Missing params' });

    const entry = await updateSingleUserLeaderboard(userId, simulationId, username);
    res.json({ success: true, leaderboardEntry: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to fetch leaderboard
router.get('/simulations/:simulationId/leaderboard', async (req, res) => {
  try {
    const { simulationId } = req.params;

    // 1. Find ALL unique userIds who have submitted for this simulation's problems
    const problemIds = await getProblemsForSimulation(simulationId);
    const uniqueSubmitters = await Submission.distinct('userId', { problemId: { $in: problemIds } });

    // 2. Update/Heal entries for everyone we found
    await Promise.all(uniqueSubmitters.map(uid => updateSingleUserLeaderboard(uid, simulationId)));

    // 3. Fetch sorted results: 
    // Primary: PassedTests DESC
    // Secondary: Lowest Total Time Taken ASC
    // Tertiary: Earlier Submission
    const leaderboardEntries = await Leaderboard.find({ simulationId })
      .sort({
        totalPassedTests: -1, // More tests passed = higher rank
        totalTimeTaken: 1,    // Less time taken = higher rank (tie-breaker)
        lastSubmissionTime: 1 // Earlier submission = higher rank (final tie-breaker)
      });

    const leaderboard = leaderboardEntries.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1,
      dsaScores: Object.fromEntries(entry.dsaScores || new Map())
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;