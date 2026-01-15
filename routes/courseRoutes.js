const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Register a new course user
router.post("/register", courseController.addCourseRegisteredUser);

// Login user
router.post("/login", courseController.loginUser);

// Dispatch emails to multiple recipients
router.post("/dispatchEmail", courseController.dispatchEmail);

module.exports = router;
