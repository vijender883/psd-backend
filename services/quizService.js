// services/quizService.js
// Updated to include resultsAvailableAfterHours when initializing quizzes
const fs = require("fs").promises;
const path = require("path");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

// Service to load quizzes from JSON file
exports.loadQuizzesFromFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const quizzes = JSON.parse(data);

    for (const quizData of quizzes) {
      // Create the quiz with all settings including results availability
      const quiz = new Quiz({
        title: quizData.title,
        description: quizData.description,
        scheduledStartTime: quizData.scheduledStartTime || null,
        lateJoinWindowMinutes: quizData.lateJoinWindowMinutes || 5,
        resultsAvailableAfterHours: quizData.resultsAvailableAfterHours || 2,
      });

      await quiz.save();

      // Create questions for the quiz
      for (let i = 0; i < quizData.questions.length; i++) {
        const questionData = quizData.questions[i];

        const question = new Question({
          quizId: quiz._id,
          text: questionData.text,
          options: questionData.options,
          timeLimit: questionData.timeLimit || 30, // Default 30 seconds if not specified
          order: i + 1,
          imageUrl: questionData.imageUrl || null, // Add imageUrl handling
        });

        await question.save();
      }
    }

    return {
      success: true,
      message: `${quizzes.length} quizzes loaded successfully`,
    };
  } catch (error) {
    console.error("Error loading quizzes:", error);
    return { success: false, message: "Failed to load quizzes", error };
  }
};

// Sample initialization function (called on server startup)
exports.initializeQuizzes = async () => {
  try {
    // Check if any quizzes exist
    const quizzesCount = await Quiz.countDocuments();

    // If no quizzes, load sample quizzes
    if (quizzesCount === 0) {
      // Calculate dates for sample scheduled quizzes
      const now = new Date();

      // Quiz starting in 10 minutes
      const startingSoon = new Date(now);
      startingSoon.setMinutes(now.getMinutes() + 10);

      const sampleQuizzes = [
        {
          title: "MERN Stack Basics",
          description: "Test your knowledge of the MERN stack fundamentals",
          scheduledStartTime: null, // Available immediately
          lateJoinWindowMinutes: 5,
          resultsAvailableAfterHours: 2, // Results available 2 hours after starting
          questions: [
            {
              text: "What does MERN stand for?",
              timeLimit: 10,
              imageUrl: null,
              options: [
                { text: "MongoDB, Express, React, Node.js", isCorrect: true },
                { text: "MySQL, Express, React, Node.js", isCorrect: false },
                { text: "MongoDB, Ember, React, Node.js", isCorrect: false },
                { text: "MongoDB, Express, Ruby, Node.js", isCorrect: false },
              ],
            },
          ],
        },
        {
          title: "Scheduled JavaScript Quiz",
          description: "Join us soon for this live JavaScript quiz!",
          scheduledStartTime: startingSoon,
          lateJoinWindowMinutes: 5,
          resultsAvailableAfterHours: 0.01, // Results available 1 hour after starting
          questions: [
            // questions...
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
          resultsAvailableAfterHours: quizData.resultsAvailableAfterHours,
        });

        await quiz.save();

        // Create questions for the quiz
        for (let i = 0; i < quizData.questions.length; i++) {
          const questionData = quizData.questions[i];

          const question = new Question({
            quizId: quiz._id,
            text: questionData.text,
            options: questionData.options,
            timeLimit: questionData.timeLimit,
            order: i + 1,
            imageUrl: questionData.imageUrl || null,
          });

          await question.save();
        }
      }

      console.log("Sample quizzes initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing quizzes:", error);
  }
};
