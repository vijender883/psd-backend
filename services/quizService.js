// services/quizService.js
// Contains business logic for quiz operations
const fs = require('fs').promises;
const path = require('path');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Service to load quizzes from JSON file
exports.loadQuizzesFromFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const quizzes = JSON.parse(data);
    
    for (const quizData of quizzes) {
      // Create the quiz
      const quiz = new Quiz({
        title: quizData.title,
        description: quizData.description
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
          imageUrl: questionData.imageUrl || null // Add imageUrl handling
        });
        
        await question.save();
      }
    }
    
    return { success: true, message: `${quizzes.length} quizzes loaded successfully` };
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return { success: false, message: 'Failed to load quizzes', error };
  }
};

// Sample initialization function (called on server startup)
exports.initializeQuizzes = async () => {
  try {
    // Check if any quizzes exist
    const quizzesCount = await Quiz.countDocuments();
    
    // If no quizzes, load sample quizzes
    if (quizzesCount === 0) {
      const sampleQuizzes = [
        {
          title: "MERN Stack Basics",
          description: "Test your knowledge of the MERN stack fundamentals",
          questions: [
            {
              text: "What does MERN stand for?",
              timeLimit: 20,
              imageUrl: null, // Add imageUrl with default value
              options: [
                { text: "MongoDB, Express, React, Node.js", isCorrect: true },
                { text: "MySQL, Express, React, Node.js", isCorrect: false },
                { text: "MongoDB, Ember, React, Node.js", isCorrect: false },
                { text: "MongoDB, Express, Ruby, Node.js", isCorrect: false }
              ]
            },
            {
              text: "Which of these is a NoSQL database?",
              timeLimit: 15,
              imageUrl: null, // Add imageUrl with default value
              options: [
                { text: "MySQL", isCorrect: false },
                { text: "PostgreSQL", isCorrect: false },
                { text: "MongoDB", isCorrect: true },
                { text: "Oracle", isCorrect: false }
              ]
            },
            {
              text: "Which library is used for state management in React?",
              timeLimit: 25,
              imageUrl: null, // Add imageUrl with default value
              options: [
                { text: "React-DOM", isCorrect: false },
                { text: "Redux", isCorrect: true },
                { text: "Mongoose", isCorrect: false },
                { text: "Express", isCorrect: false }
              ]
            },
            {
              text: "What is Express.js?",
              timeLimit: 20,
              imageUrl: null, // Add imageUrl with default value
              options: [
                { text: "A frontend framework", isCorrect: false },
                { text: "A database system", isCorrect: false },
                { text: "A Node.js web application framework", isCorrect: true },
                { text: "A testing library", isCorrect: false }
              ]
            },
            {
              text: "Which of these is NOT a React hook?",
              timeLimit: 20,
              imageUrl: null, // Add imageUrl with default value
              options: [
                { text: "useState", isCorrect: false },
                { text: "useEffect", isCorrect: false },
                { text: "useConnect", isCorrect: true },
                { text: "useContext", isCorrect: false }
              ]
            }
          ]
        }
      ];
      
      // Create quizzes
      for (const quizData of sampleQuizzes) {
        const quiz = new Quiz({
          title: quizData.title,
          description: quizData.description
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
            imageUrl: questionData.imageUrl || null // Add imageUrl handling
          });
          
          await question.save();
        }
      }
      
      console.log('Sample quizzes initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing quizzes:', error);
  }
};