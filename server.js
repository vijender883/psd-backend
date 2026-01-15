const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeDirectories } = require("./services/codeExecutor");
const codeExecutionRouter = require("./routes/code-execution");
const mongoose = require("mongoose");
const quizRoutes = require("./routes/quizRoutes");
const courseRoutes = require("./routes/courseRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const mailRoutes = require("./routes/mailRoutes");
const eventbotRoutes = require("./routes/eventbotRoutes");

dotenv.config();

// Create Express app
const app = express();

const allowedOrigins = [
  "http://localhost:3000", // Local development
  "http://localhost:3002", // Local development
  "https://devui.alumnx.com",
  "https://alumnx.com",
  "https://psd-ui-omega.vercel.app",
  "https://practicalsystemdesign.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    retryWrites: true,
    w: "majority",
  })
  .then(() => {
    console.log("MongoDB Atlas connected successfully");
    const { host, name } = mongoose.connection;
    console.log(`Connected to database: ${name} at host: ${host}`);
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  });

// Initialize code execution directories
initializeDirectories()
  .then(() => console.log("Code execution directories initialized"))
  .catch((err) =>
    console.error("Failed to initialize code execution directories:", err)
  );

// Token verification endpoint
app.post("/api/verify-token", (req, res) => {
  const { token } = req.body;

  const isValidToken = token === process.env.ACCESS_TOKEN;
  const isAdmin = token === process.env.ADMIN_TOKEN;

  res.json({
    valid: isValidToken || isAdmin,
    isAdmin: isAdmin,
  });
});

// Mount all routes
app.use("/api/simulations", simulationRoutes);
app.use("/api/code", codeExecutionRouter);
app.use("/api/quiz", quizRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/eventbot", eventbotRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

// Print routes for debugging
app._router.stack.forEach(function (r) {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
