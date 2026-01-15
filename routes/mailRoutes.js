// routes/mailRoutes.js
const express = require("express");
const { sendMail } = require("../controllers/sendMailController");

const router = express.Router();

// POST /api/mail/send
router.post("/send", sendMail);

module.exports = router;
