const Leaderboard = require("../models/Leaderboard");
const Submission = require("../models/Submission");
const Simulation = require("../models/Simulation");
const SimulationParticipant = require("../models/SimulationParticipant");
const QuizAttempt = require("../models/QuizAttempt");

const MCQ_WEIGHT = 0.3;
const DSA_WEIGHT = 0.7;

async function calculateMcqScore(attemptId) {
  if (!attemptId) return 0;
  try {
    const attempt = await QuizAttempt.findById(attemptId);
    return attempt ? attempt.score : 0;
  } catch (e) {
    console.error("Error calculating MCQ score:", e);
    return 0;
  }
}

async function getProblemsForSimulation(simulationId) {
  try {
    const simulation = await Simulation.findById(simulationId);
    return simulation ? simulation.problemIds || [] : [];
  } catch (e) {
    return [];
  }
}

function calculateWeightedTotalScore(mcqScore, dsaScore) {
  return mcqScore * MCQ_WEIGHT + dsaScore * DSA_WEIGHT;
}

/**
 * Update Leaderboard for a user
 * POST /simulations/:simulationId/leaderboard/update
 */
exports.updateLeaderboard = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { userId, username, college } = req.body;

    if (!userId || !simulationId) {
      return res
        .status(400)
        .json({ success: false, error: "userId and simulationId required" });
    }

    // 1. Get Participant
    const participant = await SimulationParticipant.findOne({
      userId,
      simulationId,
    });

    // 2. Calculate MCQ Score
    let mcqScore = 0;
    if (participant && participant.mcqAttemptId) {
      mcqScore = await calculateMcqScore(participant.mcqAttemptId);
    }

    // 3. Calculate DSA Score
    const problemIds = await getProblemsForSimulation(simulationId);
    const dsaSubmissions = await Submission.find({
      userId,
      problemId: { $in: problemIds },
      isSubmitted: true, // Only count final submissions? Leaderboard usually counts best/final.
    });

    let totalDsaScore = 0;
    const dsaScores = {};

    // Assuming max score per problem is 100
    // We need to average or sum?
    // Logic from previous implementation: sum of scores (0-100 each problem)?
    // Previous logic: sum += Math.round((passed/total)*100)
    // If there are multiple submissions for same problem, we should take BEST or LATEST?
    // `Submission.findOne` matches one. `Submission.find` matches many.
    // We unique indexed `userId` + `problemId`, so there is ONLY ONE submission record per problem per user.
    // So this loop works.

    for (const sub of dsaSubmissions) {
      const s =
        sub.totalTests > 0 ? (sub.passedTests / sub.totalTests) * 100 : 0;
      dsaScores[sub.problemId] = Math.round(s);
      totalDsaScore += Math.round(s);
    }

    // Normalize DSA score? If 2 questions, max is 200.
    // If weights are 0.3/0.7, implies total should be normalized to same scale (e.g. 100).
    // Previous logic seemed to just sum them.
    // I will keep Sum logic but check if `totalDsaScore` needs normalization.
    // If MCQ is 0-100, DSA should probably be 0-100 total?
    // If 2 problems, max 200. 200 * 0.7 = 140. MCQ 100 * 0.3 = 30. Total 170.
    // User didn't specify formula change, so I stick to previous logic:
    // `calculateWeightedTotalScore(mcqScore, totalDsaScore)`

    const totalScore = calculateWeightedTotalScore(mcqScore, totalDsaScore);

    // 4. Update Leaderboard
    const lbEntry = await Leaderboard.findOneAndUpdate(
      { userid: userId, simulationid: simulationId }, // Schema uses lowercase userid/simulationid
      {
        username: username || "User_" + userId.slice(0, 6),
        score: totalScore,
        dsaScores, // Assuming schema allows mixed/map, previous implementation had this
        mcqScore,
        submitted_time: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, leaderboardEntry: lbEntry });
  } catch (error) {
    console.error("Update LB error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update leaderboard" });
  }
};

/**
 * Get Leaderboard
 * GET /simulations/:simulationId/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Use the static method from model
    const leaderboard = await Leaderboard.getLeaderboard(simulationId, limit);

    res.json({
      success: true,
      data: {
        simulationId,
        leaderboard,
        totalEntries: leaderboard.length,
      },
    });
  } catch (error) {
    console.error("Get LB error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

/**
 * Refresh Leaderboard (Admin/System)
 * POST /simulations/:simulationId/leaderboard/refresh
 */
exports.refreshLeaderboard = async (req, res) => {
  // Implement if needed, similar to update but iterating over all participants
  // For now, simple stub or reuse update logic
  res.status(501).json({ success: false, message: "Not implemented yet" });
};
