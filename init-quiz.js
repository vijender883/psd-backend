// init-quiz.js
// Updated to include scheduled quizzes

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
        "title": "General Knowledge Quiz",
        "description": "Test your basic knowledge with these fun and easy questions",
        "scheduledStartTime": startingSoon, // Available immediately
        "lateJoinWindowMinutes": 15,
        "questions": [
          {
            "text": "What is the name of the pet of Harry Potter?",
            "timeLimit": 8,
            "options": [
              { "text": "Hedwig", "isCorrect": true },
              { "text": "Scabbers", "isCorrect": false },
              { "text": "Crookshanks", "isCorrect": false },
              { "text": "Fang", "isCorrect": false }
            ]
          },
          {
            "text": "Water boils at 100°F.",
            "timeLimit": 8,
            "options": [
              { "text": "True", "isCorrect": false },
              { "text": "False", "isCorrect": true }
            ]
          },
          {
            "text": "Guess the car brand.",
            "timeLimit": 8,
            "imageUrl": "https://alumnxbucket01.s3.ap-south-1.amazonaws.com/Renault.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIASE5KQ7ME4GIX6WIW%2F20250228%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250228T115253Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFQaCmFwLXNvdXRoLTEiRzBFAiEAhBsotYeyijnKXG4ZtaHpfQlOJXD0jVIybrkGzCAD6sACICXq0Ouw%2BKhvkRUR6VgriVSt8Dr40qRmbKDUHf4acvMCKooDCI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMMTQ3OTk3MTI5NDgxIgxmkwX0FvxLs3qryy8q3gLsckMVMVf6ugwWabo62MS3XsXqONPoYzwNqgKEnMrIrfHEewTi4%2Bq5bt1uEvuOEwwCoqCeHz6AB0Q%2BBkZmxwkSdImEfy9aVLKxWvyL0I17XLruYzuZIMdn6Q5WyzdOHOxWLMtLijv%2BJhfLn1Jfad46%2B95gNMAnAsay64VF%2BQvkFxWrT1cggEfsHtlPguaiXTrSyggSSYBW0PeFsts5pB%2FJdwr2GVe0V85ub4Eq2bl8n3jRpKdSPkzbEKi1jKRPIqo2c4WUwRMCUIkoxM9joz%2FZR3Heu%2FFStNjNzyEMgV%2BaoHChp17igUufKkFBwlqj88LOgEmgO4R3Vcf6fsaNEsQY84aCxLYaWduWtn3k2PtwseYZvbgyhxbxvte%2FJOOhpWG1qhdng2aZzIxOHOlUR2U3IZafgNttirShcv3w09GsJ7sU6FGKnS6AG7ZIYI7B0bW2kEuUKh6adZTCOdcIuTCbw4a%2BBjqzAnV02rW4R%2BWL4rGshyWhf%2BDV8DKBM24Z3%2FJ3AovhiLRo48UDa1JpEINF8U6aoi6S2dlz8cLQClU6AUvTteN9k9h9%2BPDHzZ47kg%2B8fDsjuZ8wl91T2xv9SCWZTDx6liUeANWjMM0JaER82XKe6v%2FAvJvxapQIzCfOw5siD6ZcmP13O90ni%2FIj2LrwWvUUMkvF2ZozNOS3JRONNp5bOOhfI5A1tSPTK6hcoSb5tz%2But4N14u8I1VobfgL7pkqXgIJBm2ijXGXJOlvrnrRXoJgjpVvsgAAbH%2BfD2lOF6ikTyMgIajNixdyfpF8s8NMz7nVfB%2FF8RA6HfsaEyuQqf3MwbgZ%2B6tfnE7BC2EzrEbU1LJSQkVt4tAC%2FXP29%2FD7OniSM8IwXz4APnQ4qlAtEbVaD2p5KQmM%3D&X-Amz-Signature=5f3f64220ffcd2bd1ed6122ecab63fe9ba3ebc6e339b672c1f234e2de5c1c194&X-Amz-SignedHeaders=host&response-content-disposition=inline",
            "options": [
              { "text": "Toyota", "isCorrect": false },
              { "text": "Ford", "isCorrect": false },
              { "text": "Mercedes", "isCorrect": false },
              { "text": "Renault", "isCorrect": true }
            ]
          },
          {
            "text": "Ctrl + C, Ctrl + V, Ctrl + X is equivalent to",
            "timeLimit": 8,
            "options": [
              { "text": "Copy, Paste, Cut", "isCorrect": true },
              { "text": "Cut, Copy, Paste", "isCorrect": false },
              { "text": "Paste, Cut, Copy", "isCorrect": false },
              { "text": "Cut, Paste, Copy", "isCorrect": false }
            ]
          },
          {
            "text": "Burrito, taco, and fajita are popular dishes from which cuisine?",
            "timeLimit": 8,
            "options": [
              { "text": "Italian", "isCorrect": false },
              { "text": "Mexican", "isCorrect": true },
              { "text": "Indian", "isCorrect": false },
              { "text": "Chinese", "isCorrect": false }
            ]
          },
          {
            "text": "Identify this famous Turkish dessert.",
            "timeLimit": 10,
            "imageUrl": "https://alumnxbucket01.s3.ap-south-1.amazonaws.com/Turkish-dessert.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIASE5KQ7ME4GIX6WIW%2F20250228%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250228T115756Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFQaCmFwLXNvdXRoLTEiRzBFAiEAhBsotYeyijnKXG4ZtaHpfQlOJXD0jVIybrkGzCAD6sACICXq0Ouw%2BKhvkRUR6VgriVSt8Dr40qRmbKDUHf4acvMCKooDCI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMMTQ3OTk3MTI5NDgxIgxmkwX0FvxLs3qryy8q3gLsckMVMVf6ugwWabo62MS3XsXqONPoYzwNqgKEnMrIrfHEewTi4%2Bq5bt1uEvuOEwwCoqCeHz6AB0Q%2BBkZmxwkSdImEfy9aVLKxWvyL0I17XLruYzuZIMdn6Q5WyzdOHOxWLMtLijv%2BJhfLn1Jfad46%2B95gNMAnAsay64VF%2BQvkFxWrT1cggEfsHtlPguaiXTrSyggSSYBW0PeFsts5pB%2FJdwr2GVe0V85ub4Eq2bl8n3jRpKdSPkzbEKi1jKRPIqo2c4WUwRMCUIkoxM9joz%2FZR3Heu%2FFStNjNzyEMgV%2BaoHChp17igUufKkFBwlqj88LOgEmgO4R3Vcf6fsaNEsQY84aCxLYaWduWtn3k2PtwseYZvbgyhxbxvte%2FJOOhpWG1qhdng2aZzIxOHOlUR2U3IZafgNttirShcv3w09GsJ7sU6FGKnS6AG7ZIYI7B0bW2kEuUKh6adZTCOdcIuTCbw4a%2BBjqzAnV02rW4R%2BWL4rGshyWhf%2BDV8DKBM24Z3%2FJ3AovhiLRo48UDa1JpEINF8U6aoi6S2dlz8cLQClU6AUvTteN9k9h9%2BPDHzZ47kg%2B8fDsjuZ8wl91T2xv9SCWZTDx6liUeANWjMM0JaER82XKe6v%2FAvJvxapQIzCfOw5siD6ZcmP13O90ni%2FIj2LrwWvUUMkvF2ZozNOS3JRONNp5bOOhfI5A1tSPTK6hcoSb5tz%2But4N14u8I1VobfgL7pkqXgIJBm2ijXGXJOlvrnrRXoJgjpVvsgAAbH%2BfD2lOF6ikTyMgIajNixdyfpF8s8NMz7nVfB%2FF8RA6HfsaEyuQqf3MwbgZ%2B6tfnE7BC2EzrEbU1LJSQkVt4tAC%2FXP29%2FD7OniSM8IwXz4APnQ4qlAtEbVaD2p5KQmM%3D&X-Amz-Signature=06181c346443e863392f897b8465033dad56d0b82517f9bc4bd2b2d47dd7794f&X-Amz-SignedHeaders=host&response-content-disposition=inline",
              "options": [
              { "text": "Baklava", "isCorrect": true },
              { "text": "Kunafa", "isCorrect": false },
              { "text": "Lokum", "isCorrect": false },
              { "text": "Halva", "isCorrect": false }
            ]
          },
          {
            "text": "What is the full form of CDN which is used for caching?",
            "timeLimit": 8,
            "options": [
              { "text": "Content Delivery Network", "isCorrect": true },
              { "text": "Central Data Node", "isCorrect": false },
              { "text": "Cached Data Network", "isCorrect": false },
              { "text": "Cloud Data Navigation", "isCorrect": false }
            ]
          },
          {
            "text": "Identify the company which has this logo.",
            "timeLimit": 10,
            "imageUrl": "https://alumnxbucket01.s3.ap-south-1.amazonaws.com/Company-logo.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIASE5KQ7MEY7ZCYTE2%2F20250228%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20250228T120415Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFQaCmFwLXNvdXRoLTEiRjBEAiBJmfg%2FemxFQYjpZ%2BuZvc1blzHsugyuHu%2FBT82QcJGrfAIgay8TyeXTr6hqW5RiwjeR7zXTg30%2FeVzhHxH%2FwKyN18EqigMIjf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgwxNDc5OTcxMjk0ODEiDGwnx0CEIqkYF6bbrCreAjrq21BwI4i29v%2BePUEURqCRJUqxEDD6Zkr662BAnpSJshvD1Z%2FOwq04oya1PzEFaaoZE7alIE3YPeP6bYfw56KR9npXyNxoUFM5ICUu2ErnLBEcGd%2BUdb%2F3pcXbjwVyUGzzyY%2FhW9difn9TtHRp9eyKgg4SFlJDdxKGeTi7acH%2ByVwVFCvYH2WrSzf7suLwkjA7FZb9iQNLg%2F5oIvdx2QbwxF%2BDdRV1au7mLTxs%2BVvTthmynb7hRxi8IcPlcuHGIJk%2BResGAwKUSqd%2BqLjPWBUeSAU62vAzbOHJoTBhbYfRdiblCNMAFjPH622hxv9gLfQCMblWuZFxxRtFa%2BChGyfqIeoKu573blmKEBfEIjAB09cYXNm8jBqvoatLOCFv0Pqh6En%2BoF1WGdpCIk%2BvaryVXM7Y3CYduj0QY%2BdelHdz%2Fn0YZNoj0REWPJVINSUs%2FhELmRLgQ6jzKrYwM3P0MJvDhr4GOrQCqOho18MQhna%2Bktyd6w4y4UCzGHFd7IJHg%2BShDGG%2FHqJQ2MrXn%2BmF7h4oBA9z9JkpxSaYAkNP%2FhI0tg1Z9qj2bGfVmNzcAgh7MJO5NMAErbxm8hjy%2B36QDaS68AFc%2FIin%2FUiYPKpRcuyL3xI0nz4i5iNozwO%2Fj3aIlY%2F%2BpljpKFNpPywjztSgcrKjpnFV4iVrBSWeLxndwdVCCj9v6FxZnoq9b7ax9ua0PH%2Fjmjj8LvlN2si5ZlqOobwq1AngnVtdMQvqoud3nm1hGZy%2F%2FC%2BDVIeak6cAQMf4wG%2FfkQT4T0g1vnVhbU8NXvMaw7x3MQ1MF47TQ6c8XgnbP8Bd%2BOHyuFyYb9LS0e68xIQ3GmTlkvTCcUf8k54RrJN4jBPxkVApGNy7pgzGYD9sEOHESRMDK96syzg%3D&X-Amz-Signature=c124a1014b2e950876d8736cda3784d920bbc01fbd87386a0d2caca63f0ff1b4&X-Amz-SignedHeaders=host&response-content-disposition=inline",            
            "options": [
              { "text": "Gucci", "isCorrect": true },
              { "text": "GwenGaurds", "isCorrect": false },
              { "text": "Google", "isCorrect": false },
              { "text": "Amazon", "isCorrect": false }
            ]
          },
          {
            "text": "Which spice is derived from the Crocus flower?",
            "timeLimit": 8,
            "options": [
              { "text": "Saffron", "isCorrect": true },
              { "text": "Turmeric", "isCorrect": false },
              { "text": "Paprika", "isCorrect": false },
              { "text": "Cinnamon", "isCorrect": false }
            ]
          },
          {
            "text": "What is seen in the middle of 'March' and 'April'?",
            "timeLimit": 8,
            "options": [
              { "text": "R", "isCorrect": true },
              { "text": "H", "isCorrect": false },
              { "text": "P", "isCorrect": false },
              { "text": "L", "isCorrect": false }
            ]
          }
        ]
      },
      {
        "title": "Scheduled Quiz (Starting Soon)",
        "description": "This quiz will start shortly. Join the waiting room to participate!",
        "scheduledStartTime": startingSoon,
        "lateJoinWindowMinutes": 5,
        "questions": [
          {
            "text": "Who wrote 'Romeo and Juliet'?",
            "timeLimit": 20,
            "options": [
              { "text": "Charles Dickens", "isCorrect": false },
              { "text": "William Shakespeare", "isCorrect": true },
              { "text": "Jane Austen", "isCorrect": false },
              { "text": "Mark Twain", "isCorrect": false }
            ]
          },
          {
            "text": "What is the chemical symbol for gold?",
            "timeLimit": 15,
            "options": [
              { "text": "Go", "isCorrect": false },
              { "text": "Gl", "isCorrect": false },
              { "text": "Au", "isCorrect": true },
              { "text": "Ag", "isCorrect": false }
            ]
          },
          {
            "text": "How many sides does a hexagon have?",
            "timeLimit": 10,
            "options": [
              { "text": "5", "isCorrect": false },
              { "text": "6", "isCorrect": true },
              { "text": "7", "isCorrect": false },
              { "text": "8", "isCorrect": false }
            ]
          }
        ]
      },
      {
        "title": "Tomorrow's Quiz",
        "description": "Join us tomorrow for this scheduled quiz!",
        "scheduledStartTime": startingTomorrow,
        "lateJoinWindowMinutes": 10, // 10 minute late join window
        "questions": [
          {
            "text": "Which ocean is the largest?",
            "timeLimit": 20,
            "options": [
              { "text": "Atlantic Ocean", "isCorrect": false },
              { "text": "Indian Ocean", "isCorrect": false },
              { "text": "Pacific Ocean", "isCorrect": true },
              { "text": "Arctic Ocean", "isCorrect": false }
            ]
          },
          {
            "text": "In which year did World War II end?",
            "timeLimit": 15,
            "options": [
              { "text": "1943", "isCorrect": false },
              { "text": "1945", "isCorrect": true },
              { "text": "1947", "isCorrect": false },
              { "text": "1950", "isCorrect": false }
            ]
          }
        ]
      },
      {
        "title": "Quiz in Progress",
        "description": "This quiz has already started, but you can still join!",
        "scheduledStartTime": startedRecently,
        "lateJoinWindowMinutes": 15, // 15 minute late join window
        "questions": [
          {
            "text": "What is the capital of Japan?",
            "timeLimit": 20,
            "options": [
              { "text": "Beijing", "isCorrect": false },
              { "text": "Seoul", "isCorrect": false },
              { "text": "Tokyo", "isCorrect": true },
              { "text": "Bangkok", "isCorrect": false }
            ]
          },
          {
            "text": "What is the largest planet in our solar system?",
            "timeLimit": 20,
            "options": [
              { "text": "Earth", "isCorrect": false },
              { "text": "Saturn", "isCorrect": false },
              { "text": "Jupiter", "isCorrect": true },
              { "text": "Neptune", "isCorrect": false }
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
        console.log(`Question ${i + 1} created for ${quiz.title}`);
      }
    }

    console.log('Sample quizzes with scheduling initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing quizzes:', error);
    process.exit(1);
  }
}