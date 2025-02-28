// services/quizService.js
// Updated to include scheduling information
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
      // Create the quiz with scheduling information
      const quiz = new Quiz({
        title: quizData.title,
        description: quizData.description,
        scheduledStartTime: quizData.scheduledStartTime || null,
        lateJoinWindowMinutes: quizData.lateJoinWindowMinutes || 5
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
          questions: [
            {
              text: "What does MERN stand for?",
              timeLimit: 20,
              imageUrl: null,
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
              imageUrl: null,
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
              imageUrl: null,
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
              imageUrl: null,
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
              imageUrl: null,
              options: [
                { text: "useState", isCorrect: false },
                { text: "useEffect", isCorrect: false },
                { text: "useConnect", isCorrect: true },
                { text: "useContext", isCorrect: false }
              ]
            }
          ]
        },
        {
          title: "Scheduled JavaScript Quiz",
          description: "Join us soon for this live JavaScript quiz!",
          scheduledStartTime: startingSoon,
          lateJoinWindowMinutes: 5,
          questions: [
            {
              text: "Which method adds an element to the end of an array?",
              timeLimit: 15,
              imageUrl: null,
              options: [
                { text: "push()", isCorrect: true },
                { text: "pop()", isCorrect: false },
                { text: "unshift()", isCorrect: false },
                { text: "shift()", isCorrect: false }
              ]
            },
            {
              text: "What does the 'typeof' operator return for an array?",
              timeLimit: 20,
              imageUrl: null,
              options: [
                { text: "array", isCorrect: false },
                { text: "object", isCorrect: true },
                { text: "Array", isCorrect: false },
                { text: "list", isCorrect: false }
              ]
            },
            {
              text: "Which statement is used to exit a switch statement?",
              timeLimit: 15,
              imageUrl: null,
              options: [
                { text: "exit", isCorrect: false },
                { text: "return", isCorrect: false },
                { text: "break", isCorrect: true },
                { text: "continue", isCorrect: false }
              ]
            }
          ]
        }
      ];
      
      // Create quizzes
      for (const quizData of sampleQuizzes) {
        const quiz = new Quiz({
          title: quizData.title,
          description: quizData.description,
          scheduledStartTime: quizData.scheduledStartTime,
          lateJoinWindowMinutes: quizData.lateJoinWindowMinutes
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
            imageUrl: questionData.imageUrl || null
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