// init-quiz.js
// Updated to include scheduled quizzes

const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const dotenv = require("dotenv");
const Quiz = require("./models/Quiz");
const Question = require("./models/Question");

dotenv.config();

// Connect to MongoDB
// mongoose.connect(process.env.MONGODB_LOCAL_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('MongoDB connected successfully');
//   initQuizzes();
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
//   process.exit(1);
// });

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
  })
  .then(() => {
    console.log("MongoDB Atlas connected successfully");
    // Log connection details (without sensitive info)
    const { host, name } = mongoose.connection;
    console.log(`Connected to database: ${name} at host: ${host}`);
    initQuizzes();
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1); // Exit if cannot connect to database
  });

async function initQuizzes() {
  try {
    // Drop existing collections to start fresh
    console.log("Dropping existing quiz collections...");

    // Drop collections in proper order (attempts first due to references)
    await mongoose.connection
      .collection("quizattempts")
      .drop()
      .catch((err) => {
        if (err.code !== 26) {
          // Ignore "namespace not found" errors
          console.log(
            "No QuizAttempts collection to drop or error:",
            err.message
          );
        }
      });

    await mongoose.connection
      .collection("questions")
      .drop()
      .catch((err) => {
        if (err.code !== 26) {
          console.log("No Questions collection to drop or error:", err.message);
        }
      });

    await mongoose.connection
      .collection("quizzes")
      .drop()
      .catch((err) => {
        if (err.code !== 26) {
          console.log("No Quizzes collection to drop or error:", err.message);
        }
      });

    console.log(
      "Collections dropped successfully. Initializing new quizzes..."
    );

    // Calculate dates for sample scheduled quizzes
    const now = new Date();

    // Quiz starting in 10 minutes
    const startingSoon = new Date(now);
    startingSoon.setMinutes(now.getMinutes() + 1);

    // OR to set it to a specific time like 3:50pm today
    const specificTime = new Date();
    specificTime.setHours(17, 5, 0, 0); // 24-hour format: 15:50 = 3:50pm

    // Quiz starting tomorrow
    const startingTomorrow = new Date(now);
    startingTomorrow.setDate(now.getDate() + 1);
    startingTomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

    // Quiz that's already in progress (started 2 minutes ago)
    const startedRecently = new Date(now);
    startedRecently.setMinutes(now.getMinutes() - 2);

    // Sample quizzes with images and scheduling
    const sampleQuizzes = [
      {
        title: "General Knowledge Quiz",
        description:
          "Test your basic knowledge with these fun and easy questions",
        scheduledStartTime: startingSoon, // Available immediately
        lateJoinWindowMinutes: 3,
        questions: [
          {
            text: "What is the name of the pet of Harry Potter?",
            timeLimit: 8,
            options: [
              { text: "Hedwig", isCorrect: true },
              { text: "Scabbers", isCorrect: false },
              { text: "Crookshanks", isCorrect: false },
              { text: "Fang", isCorrect: false },
            ],
          },
          {
            text: "Water boils at 100°F.",
            timeLimit: 8,
            options: [
              { text: "True", isCorrect: false },
              { text: "False", isCorrect: true },
            ],
          },
          {
            text: "Guess the car brand.",
            timeLimit: 8,
            imageUrl: "quiz-images/Renault.jpeg",
            options: [
              { text: "Toyota", isCorrect: false },
              { text: "Ford", isCorrect: false },
              { text: "Mercedes", isCorrect: false },
              { text: "Renault", isCorrect: true },
            ],
          },
          {
            text: "Ctrl + C, Ctrl + V, Ctrl + X is equivalent to",
            timeLimit: 8,
            options: [
              { text: "Copy, Paste, Cut", isCorrect: true },
              { text: "Cut, Copy, Paste", isCorrect: false },
              { text: "Paste, Cut, Copy", isCorrect: false },
              { text: "Cut, Paste, Copy", isCorrect: false },
            ],
          },
          {
            text: "Burrito, taco, and fajita are popular dishes from which cuisine?",
            timeLimit: 8,
            options: [
              { text: "Italian", isCorrect: false },
              { text: "Mexican", isCorrect: true },
              { text: "Indian", isCorrect: false },
              { text: "Chinese", isCorrect: false },
            ],
          },
          {
            text: "Identify this famous Turkish dessert.",
            timeLimit: 10,
            imageUrl: "quiz-images/Turkish-dessert.jpeg",
            options: [
              { text: "Baklava", isCorrect: true },
              { text: "Kunafa", isCorrect: false },
              { text: "Lokum", isCorrect: false },
              { text: "Halva", isCorrect: false },
            ],
          },
          {
            text: "What is the full form of CDN which is used for caching?",
            timeLimit: 8,
            options: [
              { text: "Content Delivery Network", isCorrect: true },
              { text: "Central Data Node", isCorrect: false },
              { text: "Cached Data Network", isCorrect: false },
              { text: "Cloud Data Navigation", isCorrect: false },
            ],
          },
          {
            text: "Identify the company which has this logo.",
            timeLimit: 10,
            imageUrl: "quiz-images/Company-logo.jpeg",
            options: [
              { text: "Gucci", isCorrect: true },
              { text: "GwenGaurds", isCorrect: false },
              { text: "Google", isCorrect: false },
              { text: "Amazon", isCorrect: false },
            ],
          },
          {
            text: "Which spice is derived from the Crocus flower?",
            timeLimit: 8,
            options: [
              { text: "Saffron", isCorrect: true },
              { text: "Turmeric", isCorrect: false },
              { text: "Paprika", isCorrect: false },
              { text: "Cinnamon", isCorrect: false },
            ],
          },
          {
            text: "What is seen in the middle of 'March' and 'April'?",
            timeLimit: 8,
            options: [
              { text: "R", isCorrect: true },
              { text: "H", isCorrect: false },
              { text: "P", isCorrect: false },
              { text: "L", isCorrect: false },
            ],
          },
        ],
      },
      {
        title: "Scheduled Quiz (Starting Soon)",
        description:
          "This quiz will start shortly. Join the waiting room to participate!",
        scheduledStartTime: startingSoon,
        lateJoinWindowMinutes: 5,
        questions: [
          {
            text: "Who wrote 'Romeo and Juliet'?",
            timeLimit: 20,
            options: [
              { text: "Charles Dickens", isCorrect: false },
              { text: "William Shakespeare", isCorrect: true },
              { text: "Jane Austen", isCorrect: false },
              { text: "Mark Twain", isCorrect: false },
            ],
          },
          {
            text: "What is the chemical symbol for gold?",
            timeLimit: 15,
            options: [
              { text: "Go", isCorrect: false },
              { text: "Gl", isCorrect: false },
              { text: "Au", isCorrect: true },
              { text: "Ag", isCorrect: false },
            ],
          },
          {
            text: "How many sides does a hexagon have?",
            timeLimit: 10,
            options: [
              { text: "5", isCorrect: false },
              { text: "6", isCorrect: true },
              { text: "7", isCorrect: false },
              { text: "8", isCorrect: false },
            ],
          },
        ],
      },
      {
        title: "Tomorrow's Quiz",
        description: "Join us tomorrow for this scheduled quiz!",
        scheduledStartTime: startingTomorrow,
        lateJoinWindowMinutes: 10, // 10 minute late join window
        questions: [
          {
            text: "Which ocean is the largest?",
            timeLimit: 20,
            options: [
              { text: "Atlantic Ocean", isCorrect: false },
              { text: "Indian Ocean", isCorrect: false },
              { text: "Pacific Ocean", isCorrect: true },
              { text: "Arctic Ocean", isCorrect: false },
            ],
          },
          {
            text: "In which year did World War II end?",
            timeLimit: 15,
            options: [
              { text: "1943", isCorrect: false },
              { text: "1945", isCorrect: true },
              { text: "1947", isCorrect: false },
              { text: "1950", isCorrect: false },
            ],
          },
        ],
      },
      {
        title: "Quiz in Progress",
        description: "This quiz has already started, but you can still join!",
        scheduledStartTime: startedRecently,
        lateJoinWindowMinutes: 5, // 5 minute late join window
        questions: [
          {
            text: "What is the capital of Japan?",
            timeLimit: 20,
            options: [
              { text: "Beijing", isCorrect: false },
              { text: "Seoul", isCorrect: false },
              { text: "Tokyo", isCorrect: true },
              { text: "Bangkok", isCorrect: false },
            ],
          },
          {
            text: "What is the largest planet in our solar system?",
            timeLimit: 20,
            options: [
              { text: "Earth", isCorrect: false },
              { text: "Saturn", isCorrect: false },
              { text: "Jupiter", isCorrect: true },
              { text: "Neptune", isCorrect: false },
            ],
          },
        ],
      },
    ];

    // Create quizzes
    for (const quizData of sampleQuizzes) {
      const quiz = new Quiz({
        title: quizData.title,
        description: quizData.description,
        scheduledStartTime: quizData.scheduledStartTime,
        lateJoinWindowMinutes: quizData.lateJoinWindowMinutes,
      });

      await quiz.save();
      console.log(`Quiz created: ${quiz.title}`);

      // Create questions for the quiz
      for (let i = 0; i < quizData.questions.length; i++) {
        const questionData = quizData.questions[i];

        const question = new Question({
          quizId: quiz._id,
          text: questionData.text,
          options: questionData.options,
          timeLimit: questionData.timeLimit || 30,
          order: i + 1,
          imageUrl: questionData.imageUrl,
        });

        await question.save();
        console.log(`Question ${i + 1} created for ${quiz.title}`);
      }
    }

    console.log("Sample quizzes with scheduling initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing quizzes:", error);
    process.exit(1);
  }
}
