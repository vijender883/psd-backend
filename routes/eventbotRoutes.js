const express = require('express');
const router = express.Router();
const eventbotController = require('../controllers/eventbotController');

// Start a new quiz attempt
router.post('/registerUser', eventbotController.addRegisteredUser);
router.post('/getRegisteredUserList', eventbotController.getRegisteredUserList);
router.post('/checkinUser', eventbotController.checkinUser);

module.exports = router;