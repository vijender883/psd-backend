// controllers/quizController.js
// Handles business logic for quiz operations with improved timing flow
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');

// Get all available quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true }).select('title description createdAt');
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error in getAllQuizzes:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get a specific quiz with its questions
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Get quiz questions without revealing correct answers
    const questions = await Question.find({ quizId: quiz._id })
  .select('text options._id options.text timeLimit order imageUrl')  // Add imageUrl here
  .sort('order');
    
    res.status(200).json({
      success: true,
      data: {
        quiz,
        questions
      }
    });
  } catch (error) {
    console.error('Error in getQuizById:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Start a new quiz attempt
exports.startQuizAttempt = async (req, res) => {
  try {
    const { userId, quizId } = req.body;
    
    if (!userId || !quizId) {
      return res.status(400).json({ success: false, message: 'User ID and Quiz ID are required' });
    }
    
    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Count total questions
    const totalQuestions = await Question.countDocuments({ quizId });
    
    // Create new quiz attempt
    const quizAttempt = new QuizAttempt({
      userId,
      quizId,
      totalQuestions,
      answers: []
    });
    
    await quizAttempt.save();
    
    res.status(201).json({
      success: true,
      data: {
        attemptId: quizAttempt._id,
        totalQuestions
      }
    });
  } catch (error) {
    console.error('Error in startQuizAttempt:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Submit answer for a question (modified to not reveal correct answer immediately)
exports.submitAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedOption, timeSpent } = req.body;
    
    if (!attemptId || !questionId || timeSpent === undefined) {
      return res.status(400).json({
        success: false, 
        message: 'Required fields missing'
      });
    }
    
    // Find quiz attempt
    const quizAttempt = await QuizAttempt.findById(attemptId);
    if (!quizAttempt) {
      return res.status(404).json({
        success: false, 
        message: 'Quiz attempt not found'
      });
    }
    
    // Find question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false, 
        message: 'Question not found'
      });
    }
    
    // Store the answer but don't check correctness yet
    quizAttempt.answers.push({
      questionId,
      selectedOption,
      isCorrect: false, // We'll update this later
      timeSpent
    });
    
    await quizAttempt.save();
    
    // Return success but don't reveal correct answer
    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    res.status(500).json({
      success: false, 
      message: 'Server Error', 
      error: error.message
    });
  }
};

// Get correct answer after time expires
exports.getCorrectAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { attemptId } = req.query; // Get attemptId from query parameter
    
    // Get the question
    const question = await Question.findById(questionId).select('options explanation');
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found',
        data: { correctOptionId: null }
      });
    }
    
    // Find the correct option
    const correctOption = question.options.find(option => option.isCorrect === true);
    
    if (!correctOption) {
      console.error(`No correct option marked for question ${questionId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Question has no correct option marked',
        data: { correctOptionId: null }
      });
    }
    
    // If attemptId is provided, update the answer's correctness
    if (attemptId) {
      try {
        const quizAttempt = await QuizAttempt.findById(attemptId);
        if (quizAttempt) {
          console.log(`Updating correctness for attempt ${attemptId}, question ${questionId}`);
          
          // Find the answer for this question
          const answerIndex = quizAttempt.answers.findIndex(
            answer => answer.questionId.toString() === questionId
          );
          
          if (answerIndex !== -1) {
            const answer = quizAttempt.answers[answerIndex];
            
            // Update correctness by comparing with the correct option
            const isCorrect = answer.selectedOption && 
              answer.selectedOption.toString() === correctOption._id.toString();
            
            console.log(`User selected: ${answer.selectedOption}, correct: ${correctOption._id}, isCorrect: ${isCorrect}`);
            
            quizAttempt.answers[answerIndex].isCorrect = isCorrect;
            
            // Update score if correct
            if (isCorrect && !quizAttempt.answers[answerIndex].alreadyCounted) {
              quizAttempt.score += 1;
              quizAttempt.answers[answerIndex].alreadyCounted = true;
            }
            
            await quizAttempt.save();
          } else {
            console.warn(`Answer for question ${questionId} not found in attempt ${attemptId}`);
          }
        }
      } catch (updateError) {
        console.error('Error updating answer correctness:', updateError);
        // Continue anyway to return the correct answer
      }
    }
    
    // Generate leaderboard data for this question
    let leaderboard = [];
    try {
      leaderboard = await generateLeaderboardForQuestion(questionId, attemptId);
    } catch (leaderboardError) {
      console.error('Error generating leaderboard:', leaderboardError);
      // Continue without leaderboard
    }
    
    res.status(200).json({
      success: true,
      data: {
        correctOptionId: correctOption._id,
        explanation: question.explanation || 'No explanation provided',
        leaderboard
      }
    });
  } catch (error) {
    console.error('Error in getCorrectAnswer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message,
      data: { correctOptionId: null }
    });
  }
};

// Helper function to generate leaderboard data for a specific question
async function generateLeaderboardForQuestion(questionId, currentAttemptId) {
  try {
    // Get the quiz ID from the question
    const question = await Question.findById(questionId).select('quizId');
    if (!question) {
      return [];
    }
    
    // Find all attempts for this quiz
    const attempts = await QuizAttempt.find({
      quizId: question.quizId
    });
    
    if (!attempts || attempts.length === 0) {
      return [];
    }
    
    // Extract and calculate scores
    const scores = attempts.map(attempt => {
      return {
        userId: attempt.userId,
        score: attempt.score || 0,
        isCurrentUser: attempt._id.toString() === (currentAttemptId || '').toString()
      };
    });
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    // Add ranks
    return scores.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    return [];
  }
}

// Complete a quiz attempt
exports.completeQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const quizAttempt = await QuizAttempt.findById(attemptId);
    if (!quizAttempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    
    quizAttempt.completedAt = Date.now();
    await quizAttempt.save();
    
    res.status(200).json({
      success: true,
      message: 'Quiz attempt completed successfully'
    });
  } catch (error) {
    console.error('Error in completeQuizAttempt:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get quiz results and leaderboard
exports.getQuizResults = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const quizAttempt = await QuizAttempt.findById(attemptId).populate('quizId');
    if (!quizAttempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    
    // Get leaderboard (all attempts for this quiz)
    const allAttempts = await QuizAttempt.find({ 
      quizId: quizAttempt.quizId,
      completedAt: { $exists: true }
    }).sort('-score');
    
    // If there are no completed attempts yet, create a default leaderboard with current user
    let leaderboard = [];
    let userRank = 1;
    
    if (allAttempts.length === 0) {
      leaderboard = [{
        rank: 1,
        userId: quizAttempt.userId,
        score: quizAttempt.score,
        isCurrentUser: true
      }];
    } else {
      // Find current user's rank
      userRank = allAttempts.findIndex(attempt => 
        attempt._id.toString() === attemptId
      ) + 1;
      
      if (userRank === 0) {
        userRank = allAttempts.length + 1; // User not in complete list yet
      }
      
      // Create focused leaderboard (top 3 + user's position)
      leaderboard = allAttempts.slice(0, 3).map((attempt, index) => ({
        rank: index + 1,
        userId: attempt.userId,
        score: attempt.score,
        isCurrentUser: attempt._id.toString() === attemptId
      }));
      
      // Add current user and adjacent users if not in top 3
      if (userRank > 3) {
        // Add user above (if exists)
        if (userRank > 1) {
          leaderboard.push({
            rank: userRank - 1,
            userId: allAttempts[userRank - 2].userId,
            score: allAttempts[userRank - 2].score,
            isCurrentUser: false
          });
        }
        
        // Add current user
        leaderboard.push({
          rank: userRank,
          userId: quizAttempt.userId,
          score: quizAttempt.score,
          isCurrentUser: true
        });
        
        // Add user below (if exists)
        if (userRank < allAttempts.length) {
          leaderboard.push({
            rank: userRank + 1,
            userId: allAttempts[userRank].userId,
            score: allAttempts[userRank].score,
            isCurrentUser: false
          });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        quizTitle: quizAttempt.quizId ? quizAttempt.quizId.title : 'Quiz',
        score: quizAttempt.score,
        totalQuestions: quizAttempt.totalQuestions,
        percentage: (quizAttempt.score / quizAttempt.totalQuestions) * 100,
        rank: userRank,
        totalParticipants: allAttempts.length || 1,
        leaderboard: leaderboard
      }
    });
  } catch (error) {
    console.error('Error in getQuizResults:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message,
      data: {
        leaderboard: []
      }
    });
  }
};