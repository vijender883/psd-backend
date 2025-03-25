// controllers/quizController.js
// Updated to support scheduled quizzes
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');

// Get all available quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    // Include scheduledStartTime and lateJoinWindowMinutes in the response
    const quizzes = await Quiz.find({ isActive: true })
      .select('title description createdAt scheduledStartTime lateJoinWindowMinutes');
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error in getAllQuizzes:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get a specific quiz with its questions
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .select('title description isActive scheduledStartTime lateJoinWindowMinutes scheduledEndTime resultsDeclarationTime');
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Get quiz questions without revealing correct answers
    let questions = await Question.find({ quizId: quiz._id })
      .select('text options._id options.text timeLimit order imageUrl')
      .sort('order');
    
    // Process questions to use public URLs instead of signed URLs
    questions = questions.map(question => {
      const questionObj = question.toObject();
      
      // If there's an image URL, replace it with the public URL
      if (questionObj.imageUrl) {
        questionObj.imageUrl = question.imagePublicUrl;
      }
      
      return questionObj;
    });
    
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

// Add this method to your quizController.js file

// Check if results are available for a specific attempt
exports.checkResultsAvailability = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const quizAttempt = await QuizAttempt.findById(attemptId);
    if (!quizAttempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz attempt not found' 
      });
    }
    
    // Use the model method to check availability
    const resultsAvailable = quizAttempt.areResultsAvailable();
    
    // Get time until results are available
    const timeUntilAvailable = quizAttempt.getTimeUntilResultsAvailable();
    
    res.status(200).json({
      success: true,
      data: {
        resultsAvailable,
        resultsAvailableAt: quizAttempt.resultsAvailableAt,
        timeUntilAvailable // in milliseconds
      }
    });
  } catch (error) {
    console.error('Error checking results availability:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// controllers/quizController.js - Updated startQuizAttempt function

exports.startQuizAttempt = async (req, res) => {
  try {
    const { userId, quizId } = req.body;
    
    if (!userId || !quizId) {
      return res.status(400).json({ success: false, message: 'User ID and Quiz ID are required' });
    }
    
    // Check if quiz exists and get its settings
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Validate whether the user can join the quiz based on schedule
    if (quiz.scheduledStartTime) {
      const startTime = new Date(quiz.scheduledStartTime).getTime();
      const now = new Date().getTime();
      const lateJoinWindow = (quiz.lateJoinWindowMinutes || 5) * 60 * 1000;
      const lateJoinDeadline = startTime + lateJoinWindow;
      
      // If the quiz hasn't started yet and is not within the allowed window
      if (now > lateJoinDeadline) {
        return res.status(403).json({ 
          success: false, 
          message: 'This quiz is no longer available to join. The scheduled start time plus late join window has passed.'
        });
      }
    }
    
    // Count total questions
    const totalQuestions = await Question.countDocuments({ quizId });
    
    // Create new quiz attempt
    const now = new Date();
    
    // Calculate when results will be available based on quiz settings
    const resultsTime = new Date(now);
    resultsTime.setHours(resultsTime.getHours() + (quiz.resultsAvailableAfterHours || 2));
    
    const quizAttempt = new QuizAttempt({
      userId, // This now stores the actual user ID
      quizId,
      totalQuestions,
      startedAt: now,
      resultsAvailableAt: resultsTime,
      answers: []
    });
    
    await quizAttempt.save();
    
    res.status(201).json({
      success: true,
      data: {
        attemptId: quizAttempt._id,
        totalQuestions,
        resultsAvailableAt: quizAttempt.resultsAvailableAt
      }
    });
  } catch (error) {
    console.error('Error in startQuizAttempt:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Create a new quiz with scheduling info
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, questions, scheduledStartTime, lateJoinWindowMinutes } = req.body;
    
    if (!title || !description || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields are missing or invalid format' 
      });
    }
    
    // Create the quiz with scheduling information
    const quiz = new Quiz({
      title,
      description,
      scheduledStartTime: scheduledStartTime || null,
      lateJoinWindowMinutes: lateJoinWindowMinutes || 5
    });
    
    await quiz.save();
    
    // Create questions for the quiz
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      
      if (!questionData.text || !questionData.options || !Array.isArray(questionData.options)) {
        continue; // Skip invalid questions
      }
      
      const question = new Question({
        quizId: quiz._id,
        text: questionData.text,
        options: questionData.options,
        timeLimit: questionData.timeLimit || 30,
        order: i + 1,
        imageUrl: questionData.imageUrl || null
      });
      
      await question.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quizId: quiz._id }
    });
  } catch (error) {
    console.error('Error in createQuiz:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update quiz scheduling information
exports.updateQuizSchedule = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { scheduledStartTime, lateJoinWindowMinutes } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Update scheduling information
    quiz.scheduledStartTime = scheduledStartTime;
    quiz.lateJoinWindowMinutes = lateJoinWindowMinutes || 5;
    
    await quiz.save();
    
    res.status(200).json({
      success: true,
      message: 'Quiz schedule updated successfully'
    });
  } catch (error) {
    console.error('Error in updateQuizSchedule:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// The rest of the controller methods remain the same
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

// Updated getCorrectAnswer function in quizController.js

// Calculate score based on time taken as a percentage of total time
function calculateTimeBasedScore(timeSpent, totalTime) {
  // Convert to percentage of time used
  const percentageTimeUsed = (timeSpent / totalTime) * 100;
  
  // Define score tiers
  if (percentageTimeUsed <= 5) {
    return 1000; // Super fast (≤5% of time) = 1000 points
  } else if (percentageTimeUsed <= 15) {
    return 980; // Very fast (≤10% of time) = 980 points
  } else if (percentageTimeUsed <= 25) {
    return 850; // Fast (≤20% of time) = 850 points
  } else if (percentageTimeUsed <= 35) {
    return 750; // Good (≤30% of time) = 750 points
  } else if (percentageTimeUsed <= 50) {
    return 600; // Decent (≤50% of time) = 600 points
  } else if (percentageTimeUsed <= 70) {
    return 450; // Average (≤70% of time) = 450 points
  } else if (percentageTimeUsed <= 85) {
    return 300; // Slow (≤85% of time) = 300 points
  } else {
    return 150; // Very slow (>85% of time) = 150 points
  }
}

// Get the correct answer for a question (after time expires)
exports.getCorrectAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { attemptId, scoringType } = req.query; // Get attemptId and scoringType from query parameters
    
    // Get the question
    const question = await Question.findById(questionId).select('options explanation timeLimit');
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
    
    let pointsEarned = 0;
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
            
            // Update score if correct (using appropriate scoring method)
            if (isCorrect && !quizAttempt.answers[answerIndex].alreadyCounted) {
              // Determine which scoring method to use
              let score;
              if (scoringType === 'simple') {
                // Simple scoring (1 point per correct answer)
                score = 1;
                console.log(`Using simple scoring: ${score} point for correct answer`);
              } else {
                // Time-based scoring (original method)
                score = calculateTimeBasedScore(answer.timeSpent, question.timeLimit);
                console.log(`Using time-based scoring: ${score} points for correct answer in ${answer.timeSpent}/${question.timeLimit} seconds`);
              }
              
              // Add calculated score
              quizAttempt.score += score;
              
              // Store the points earned for this question
              quizAttempt.answers[answerIndex].pointsEarned = score;
              quizAttempt.answers[answerIndex].alreadyCounted = true;
              
              // Set the points earned for the response
              pointsEarned = score;
            } else if (!isCorrect) {
              // Zero points for wrong answer
              quizAttempt.answers[answerIndex].pointsEarned = 0;
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
        pointsEarned: pointsEarned, // Include points earned in the response
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
        userId: quizAttempt.userId, // Using actual userId
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
        userId: attempt.userId, // Using actual userId
        score: attempt.score,
        isCurrentUser: attempt._id.toString() === attemptId
      }));
      
      // Add current user and adjacent users if not in top 3
      if (userRank > 3) {
        // Add user above (if exists)
        if (userRank > 1) {
          leaderboard.push({
            rank: userRank - 1,
            userId: allAttempts[userRank - 2].userId, // Using actual userId
            score: allAttempts[userRank - 2].score,
            isCurrentUser: false
          });
        }
        
        // Add current user
        leaderboard.push({
          rank: userRank,
          userId: quizAttempt.userId, // Using actual userId
          score: quizAttempt.score,
          isCurrentUser: true
        });
        
        // Add user below (if exists)
        if (userRank < allAttempts.length) {
          leaderboard.push({
            rank: userRank + 1,
            userId: allAttempts[userRank].userId, // Using actual userId
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
        percentage: (quizAttempt.score / (quizAttempt.totalQuestions * 1000)) * 100, // Adjusted for time-based scoring
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

// Add this to controllers/quizController.js

// Get detailed quiz attempt information including questions and answers
exports.getQuizAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    // Find the quiz attempt
    const quizAttempt = await QuizAttempt.findById(attemptId);
    if (!quizAttempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz attempt not found' 
      });
    }
    
    // Find all the questions for this quiz
    const questions = await Question.find({ 
      quizId: quizAttempt.quizId 
    }).sort('order');
    
    // Prepare the question details with the user's answers
    const questionDetails = await Promise.all(questions.map(async (question) => {
      // Find the user's answer for this question
      const answer = quizAttempt.answers.find(
        ans => ans.questionId.toString() === question._id.toString()
      );
      
      // Find the correct option
      const correctOption = question.options.find(opt => opt.isCorrect);
      
      // Transform image URL if needed
      let imageUrl = question.imageUrl;
      if (imageUrl) {
        // Use the virtual getter for public URL if available
        imageUrl = question.imagePublicUrl || imageUrl;
      }
      
      return {
        _id: question._id,
        text: question.text,
        imageUrl: imageUrl,
        options: question.options.map(opt => ({
          _id: opt._id,
          text: opt.text
        })),
        timeLimit: question.timeLimit,
        explanation: question.explanation || '',
        selectedOption: answer ? answer.selectedOption : null,
        correctOptionId: correctOption ? correctOption._id : null,
        isCorrect: answer ? answer.isCorrect : false,
        timeSpent: answer ? answer.timeSpent : null,
        pointsEarned: answer ? answer.pointsEarned : 0
      };
    }));
    
    res.status(200).json({
      success: true,
      data: {
        quizId: quizAttempt.quizId,
        score: quizAttempt.score,
        startedAt: quizAttempt.startedAt,
        completedAt: quizAttempt.completedAt,
        questions: questionDetails
      }
    });
  } catch (error) {
    console.error('Error in getQuizAttemptDetails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};