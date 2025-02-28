// routes/quizRoutes.js
// Updated API endpoints for quiz operations with kahoot-like behavior
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Get all quizzes
router.get('/quizzes', quizController.getAllQuizzes);

// Get quiz by ID
router.get('/quizzes/:id', quizController.getQuizById);

// Start a new quiz attempt
router.post('/attempts', quizController.startQuizAttempt);

// Submit answer for a question
router.post('/answers', quizController.submitAnswer);

// Get correct answer (after time expiration)
// Updated to optionally take attemptId as a query parameter
router.get('/questions/:questionId/answer', quizController.getCorrectAnswer);

// Complete a quiz attempt
router.put('/attempts/:attemptId/complete', quizController.completeQuizAttempt);

// Get quiz results and leaderboard
router.get('/attempts/:attemptId/results', quizController.getQuizResults);

module.exports = router;