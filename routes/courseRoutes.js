const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Start a new quiz attempt
router.post('/register', courseController.addCourseRegisteredUser);

module.exports = router;