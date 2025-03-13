// routes/quizRoutes.js
// Updated with endpoints for scheduled quizzes
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Get all quizzes
router.get('/quizzes', quizController.getAllQuizzes);

// Get quiz by ID
router.get('/quizzes/:id', quizController.getQuizById);

// Create a new quiz with scheduling information
router.post('/quizzes', quizController.createQuiz);

// Update quiz scheduling information
router.put('/quizzes/:quizId/schedule', quizController.updateQuizSchedule);

// Start a new quiz attempt
router.post('/attempts', quizController.startQuizAttempt);

// Submit answer for a question
router.post('/answers', quizController.submitAnswer);

// Get correct answer (after time expiration)
router.get('/questions/:questionId/answer', quizController.getCorrectAnswer);

// Complete a quiz attempt
router.put('/attempts/:attemptId/complete', quizController.completeQuizAttempt);

// Get quiz results and leaderboard
router.get('/attempts/:attemptId/results', quizController.getQuizResults);

router.get('/attempts/:attemptId/results-availability', quizController.checkResultsAvailability);

module.exports = router;