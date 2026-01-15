const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

// Update Leaderboard for a user
router.post(
  "/simulations/:simulationId/leaderboard/update",
  leaderboardController.updateLeaderboard
);

// Get Leaderboard
router.get(
  "/simulations/:simulationId/leaderboard",
  leaderboardController.getLeaderboard
);

// Refresh Leaderboard (Admin/System)
router.post(
  "/simulations/:simulationId/leaderboard/refresh",
  leaderboardController.refreshLeaderboard
);

module.exports = router;
