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
    if (!attemptId) {
      console.log('No attemptId provided for MCQ score calculation');
      return 0;
    }

    console.log(`Calculating MCQ score for attempt: ${attemptId}`);
    
    // Fetch the raw quiz attempt data directly from the database
    const attempt = await QuizAttempt.findById(attemptId);
    
    if (!attempt) {
      console.log(`Quiz attempt not found: ${attemptId}`);
      return 0;
    }
    
    // Calculate score based on correct answers
    const correctAnswers = attempt.answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = attempt.totalQuestions || attempt.answers.length;
    
    // Use the score from the attempt
    let score = attempt.score;
    
    console.log(`MCQ score calculation: ${correctAnswers} correct out of ${totalQuestions}, score: ${score}`);
    return score;
  } catch (error) {
    console.error('Error calculating MCQ score:', error);
    return 0;
  }
}

async function areResultsAvailable(simulationId) {
  try {
    const simulation = await Simulation.findOne({ simulationId });
    
    if (!simulation) {
      return true; // Default to available if simulation not found
    }
    
    return simulation.areResultsAvailable();
  } catch (error) {
    console.error('Error checking results availability:', error);
    return true; // Default to available in case of error
  }
}

// Helper function to get problems for a simulation
async function getProblemsForSimulation(simulationId) {
  try {
    const simulation = await Simulation.findOne({ simulationId });
    return simulation?.testsId?.dsaTests || [];
  } catch (error) {
    console.error('Error fetching simulation problems:', error);
    return [];
  }
}

// Calculate weighted total score
function calculateWeightedTotalScore(mcqScore, dsaScore) {
  // Normalize MCQ and DSA scores to a 0-100 scale if needed
  const normalizedMcqScore = mcqScore;
  const normalizedDsaScore = dsaScore;
  
  // Apply weights and return the weighted total
  return (normalizedMcqScore * MCQ_WEIGHT) + (normalizedDsaScore * DSA_WEIGHT);
}

// Endpoint to update leaderboard for a user
router.post('/simulations/:simulationId/leaderboard/update', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { userId, username, college } = req.body;

    if (!userId || !simulationId) {
      return res.status(400).json({
        success: false,
        error: 'userId and simulationId are required'
      });
    }

    console.log(`Updating leaderboard for user ${userId} in simulation ${simulationId}`);
    console.log(`Received user data: username=${username}, college=${college}`);

    // Get participant data
    const participant = await SimulationParticipant.findOne({ userId, simulationId });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // If a college name was provided in the request, let's update the participant record
    if (college) {
      await SimulationParticipant.findOneAndUpdate(
        { userId, simulationId },
        { college }
      );
      console.log(`Updated participant record with college: ${college}`);
    }

    // Calculate MCQ score directly from the quiz attempt
    let mcqScore = 0;
    if (participant.mcqAttemptId) {
      mcqScore = await calculateMcqScore(participant.mcqAttemptId);
      console.log(`Calculated MCQ score for user ${userId}: ${mcqScore}`);
    }

    // Get DSA problems for this simulation
    const problemIds = await getProblemsForSimulation(simulationId);

    // Get DSA submissions
    const dsaSubmissions = await Submission.find({
      userId,
      problemId: { $in: problemIds }
    });

    // Calculate DSA scores
    const dsaScores = {};
    let totalDsaScore = 0;

    for (const submission of dsaSubmissions) {
      const score = Math.round((submission.passedTests / submission.totalTests) * 100);
      dsaScores[submission.problemId] = score;
      totalDsaScore += score;
    }

    // Determine the username to use
    // Priority: 1. Request param 2. Submission username 3. Fallback
    let usernameFinal = username;
    if (!usernameFinal && dsaSubmissions.length > 0) {
      usernameFinal = dsaSubmissions[0].username;
    }
    if (!usernameFinal) {
      usernameFinal = "User_" + userId.substring(0, 6);
    }
    
    // Use provided college or fallback to participant's college
    let collegeFinal = college || participant.college || 'Not specified';

    console.log(`Final values - username: ${usernameFinal}, college: ${collegeFinal}`);

    // Calculate weighted total score
    const totalScore = calculateWeightedTotalScore(mcqScore, totalDsaScore);
    console.log(`Weighted score calculation - MCQ (${mcqScore} × ${MCQ_WEIGHT}) + DSA (${totalDsaScore} × ${DSA_WEIGHT}) = ${totalScore}`);

    // Find latest submission time
    const lastSubmissionTime = dsaSubmissions.length > 0
      ? Math.max(...dsaSubmissions.map(s => new Date(s.createdAt).getTime()))
      : participant.updatedAt || new Date();

    // Update or create leaderboard entry
    const leaderboardEntry = await Leaderboard.findOneAndUpdate(
      { userId, simulationId },
      {
        username: usernameFinal,
        college: collegeFinal,
        mcqScore,
        dsaScores,
        totalScore,
        lastSubmissionTime: new Date(lastSubmissionTime)
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      leaderboardEntry
    });

  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update leaderboard: ' + error.message
    });
  }
});

// Endpoint to fetch leaderboard
router.get('/simulations/:simulationId/leaderboard', async (req, res) => {
  try {
    const { simulationId } = req.params;

    const resultsAvailable = await areResultsAvailable(simulationId);
    
    if (!resultsAvailable) {
      return res.status(403).json({
        success: false,
        error: 'Leaderboard is not yet available for this simulation',
        available: false
      });
    }
    
    // Fetch from the leaderboard collection
    const leaderboardEntries = await Leaderboard.find({ simulationId })
      .sort({ totalScore: -1, lastSubmissionTime: 1 });

    // Add rank field based on sorted order
    const leaderboard = leaderboardEntries.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1,
      // Convert Map to regular object for serialization
      dsaScores: Object.fromEntries(entry.dsaScores || new Map())
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard: ' + error.message
    });
  }
});

// Update all leaderboard entries for a simulation
router.post('/simulations/:simulationId/leaderboard/refresh', async (req, res) => {
  try {
    const { simulationId } = req.params;
    const { currentUser } = req.body; // Receive current user data from frontend
    
    console.log(`Starting leaderboard refresh for simulation ${simulationId}`);
    if (currentUser) {
      console.log(`Current user data received:`, currentUser);
    }

    // Get all participants for this simulation
    const simulation = await Simulation.findOne({ simulationId });

    if (!simulation) {
      console.log(`Simulation not found: ${simulationId}`);
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    // Get all participants
    const participantIds = simulation.participationIds || [];
    console.log(`Found ${participantIds.length} participants for simulation ${simulationId}`);

    // Track success/failure counts
    let successCount = 0;
    let failureCount = 0;

    // Process each participant
    for (const userId of participantIds) {
      try {
        console.log(`Processing user ${userId} for simulation ${simulationId}`);

        // Check if this is the current user with additional data
        let username = null;
        let college = null;
        
        if (currentUser && currentUser.userId === userId) {
          username = currentUser.username;
          college = currentUser.college;
          console.log(`Using current user data: username=${username}, college=${college}`);
        }

        // Find participant data
        const participant = await SimulationParticipant.findOne({ userId, simulationId });
        if (!participant) {
          console.log(`Participant not found for user ${userId} in simulation ${simulationId}`);
          failureCount++;
          continue;
        }

        console.log(`Found participant data for user ${userId}: MCQ attempt ID: ${participant.mcqAttemptId}, DSA submissions: ${participant.dsaSubmissionIds?.length || 0}`);

        // If college was provided through currentUser, update the participant record
        if (college) {
          await SimulationParticipant.findOneAndUpdate(
            { userId, simulationId },
            { college }
          );
          console.log(`Updated participant record with college: ${college}`);
        } else {
          college = participant.college || 'Not specified';
        }

        // Calculate MCQ score directly from the quiz attempt
        let mcqScore = 0;
        if (participant.mcqAttemptId) {
          mcqScore = await calculateMcqScore(participant.mcqAttemptId);
          console.log(`Calculated MCQ score for user ${userId}: ${mcqScore}`);
        } else {
          console.log(`No MCQ attempt ID found for user ${userId}`);
        }

        // Get DSA problems for this simulation
        const problemIds = await getProblemsForSimulation(simulationId);
        console.log(`Problems for simulation ${simulationId}:`, problemIds);

        // Get DSA submissions
        const dsaSubmissions = await Submission.find({
          userId,
          problemId: { $in: problemIds }
        });
        console.log(`Found ${dsaSubmissions.length} DSA submissions for user ${userId}`);

        // Get username from different sources
        if (!username && dsaSubmissions.length > 0) {
          // Find the newest submission
          const newestSubmission = dsaSubmissions.reduce((newest, current) => {
            return new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest;
          }, dsaSubmissions[0]);
          
          username = newestSubmission.username;
          console.log(`Got username from submission: ${username}`);
        }
        
        // If no username found, use participant.username if available
        if (!username && participant.username) {
          username = participant.username;
          console.log(`Got username from participant record: ${username}`);
        }
        
        // Default fallback
        if (!username) {
          username = "User_" + userId.substring(0, 6);
          console.log(`Using fallback username: ${username}`);
        }

        // Calculate DSA scores
        const dsaScores = {};
        let totalDsaScore = 0;

        for (const submission of dsaSubmissions) {
          const score = Math.round((submission.passedTests / submission.totalTests) * 100);
          dsaScores[submission.problemId] = score;
          totalDsaScore += score;
          console.log(`DSA score for user ${userId}, problem ${submission.problemId}: ${score}`);
        }

        // Calculate weighted total score using the new formula
        const totalScore = calculateWeightedTotalScore(mcqScore, totalDsaScore);
        console.log(`Weighted score calculation - MCQ (${mcqScore} × ${MCQ_WEIGHT}) + DSA (${totalDsaScore} × ${DSA_WEIGHT}) = ${totalScore}`);

        // Find latest submission time
        const lastSubmissionTime = dsaSubmissions.length > 0
          ? Math.max(...dsaSubmissions.map(s => new Date(s.createdAt).getTime()))
          : participant.updatedAt || new Date();

        // Update or create leaderboard entry
        const leaderboardEntry = await Leaderboard.findOneAndUpdate(
          { userId, simulationId },
          {
            username,
            college,
            mcqScore,
            dsaScores,
            totalScore,
            lastSubmissionTime: new Date(lastSubmissionTime)
          },
          { upsert: true, new: true }
        );

        console.log(`Updated leaderboard entry for user ${userId}:`, leaderboardEntry);
        successCount++;
      } catch (error) {
        console.error(`Error updating leaderboard for user ${userId}:`, error);
        failureCount++;
      }
    }

    console.log(`Leaderboard refresh completed for simulation ${simulationId}. Success: ${successCount}, Failed: ${failureCount}`);

    res.json({
      success: true,
      message: `Leaderboard refresh completed. Success: ${successCount}, Failed: ${failureCount}`,
      totalParticipants: participantIds.length
    });

  } catch (error) {
    console.error('Error refreshing leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh leaderboard: ' + error.message
    });
  }
});

module.exports = router;