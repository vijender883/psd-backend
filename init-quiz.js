// init-quiz.js

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');

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
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('MongoDB Atlas connected successfully');
  // Log connection details (without sensitive info)
  const { host, name } = mongoose.connection;
  console.log(`Connected to database: ${name} at host: ${host}`);
  initQuizzes();
})
.catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

async function initQuizzes() {
  try {
    // Drop existing collections to start fresh
    console.log('Dropping existing quiz collections...');
    
    // Drop collections in proper order (attempts first due to references)
    await mongoose.connection.collection('quizattempts').drop().catch(err => {
      if (err.code !== 26) { // Ignore "namespace not found" errors
        console.log('No QuizAttempts collection to drop or error:', err.message);
      }
    });
    
    await mongoose.connection.collection('questions').drop().catch(err => {
      if (err.code !== 26) {
        console.log('No Questions collection to drop or error:', err.message);
      }
    });
    
    await mongoose.connection.collection('quizzes').drop().catch(err => {
      if (err.code !== 26) {
        console.log('No Quizzes collection to drop or error:', err.message);
      }
    });
    
    console.log('Collections dropped successfully. Initializing new quizzes...');
    
    // Sample quizzes with images
    const sampleQuizzes = [
        {
          "title": "General Knowledge Quiz",
          "description": "Test your basic knowledge with these fun and easy questions",
          "questions": [
            {
              "text": "What is the capital of France?",
              "timeLimit": 20,
              "options": [
                { "text": "Berlin", "isCorrect": false },
                { "text": "Madrid", "isCorrect": false },
                { "text": "Paris", "isCorrect": true },
                { "text": "Rome", "isCorrect": false }
              ]
            },
            {
              "text": "Which animal is known as the 'King of the Jungle'?",
              "timeLimit": 15,
              "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg",
              "options": [
                { "text": "Tiger", "isCorrect": false },
                { "text": "Elephant", "isCorrect": false },
                { "text": "Lion", "isCorrect": true },
                { "text": "Cheetah", "isCorrect": false }
              ]
            },
            {
              "text": "What is 2 + 2?",
              "timeLimit": 10,
              "options": [
                { "text": "3", "isCorrect": false },
                { "text": "4", "isCorrect": true },
                { "text": "5", "isCorrect": false },
                { "text": "6", "isCorrect": false }
              ]
            },
            {
              "text": "Which planet is known as the Red Planet?",
              "timeLimit": 20,
              "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
              "options": [
                { "text": "Venus", "isCorrect": false },
                { "text": "Mars", "isCorrect": true },
                { "text": "Jupiter", "isCorrect": false },
                { "text": "Saturn", "isCorrect": false }
              ]
            },
            {
              "text": "What is the name of the tallest mountain in the world?",
              "timeLimit": 25,
              "imageUrl": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.livescience.com%2F23359-mount-everest.html&psig=AOvVaw3XwDHo40Mq1DdVBqpupNHt&ust=1740815957141000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIimuPny5YsDFQAAAAAdAAAAABAE",
              "options": [
                { "text": "K2", "isCorrect": false },
                { "text": "Mount Everest", "isCorrect": true },
                { "text": "Kilimanjaro", "isCorrect": false },
                { "text": "Denali", "isCorrect": false }
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
          imageUrl: questionData.imageUrl
        });
        
        await question.save();
        console.log(`Question ${i+1} created for ${quiz.title}`);
      }
    }
    
    console.log('Sample quizzes with images initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing quizzes:', error);
    process.exit(1);
  }
}