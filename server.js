const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const { initializeDirectories } = require('./services/codeExecutor');
const codeExecutionRouter = require('./routes/code-execution');
const mongoose = require('mongoose');
const quizRoutes = require('./routes/quizRoutes');
const courseRoutes = require('./routes/courseRoutes');
const { initializeQuizzes } = require('./services/quizService');
const simulationRoutes = require('./routes/simulationRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

dotenv.config();

const app = express();
const allowedOrigins = [
  'http://localhost:3000',  // Local development
  'http://localhost:3002',  // Local development

  // Your production frontend URL
  'https://devui.alumnx.com',
  'https://alumnx.com',
  'https://psd-ui-omega.vercel.app',
  'https://practicalsystemdesign.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// initializeQuizzes()
//   .then(() => console.log('Sample quizzes initialized successfully'))
//   .catch(err => console.error('Error initializing quizzes:', err));

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully \n');
    console.log('Connection config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

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
})
.catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// mongoose.connect(process.env.MONGODB_LOCAL_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
//   .then(() => console.log('MongoDB connected successfully \n'))
//   .catch(err => console.error('MongoDB connection error:', err));


// Initialize code execution directories
initializeDirectories()
  .then(() => console.log('Code execution directories initialized'))
  .catch(err => console.error('Failed to initialize code execution directories:', err));

// In server.js
app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;

  // Check if token is valid
  const isValidToken = token === process.env.ACCESS_TOKEN;
  // Check if token is admin token
  const isAdmin = token === process.env.ADMIN_TOKEN;

  res.json({
    valid: isValidToken || isAdmin,
    isAdmin: isAdmin
  });
});

// In server.js, modify the /api/execute endpoint
app.post('/api/execute', async (req, res) => {
  const { query } = req.body;

  const disallowedKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE'];
  const containsDisallowedKeyword = disallowedKeywords.some(keyword =>
    query?.toString().toUpperCase().includes(keyword) ?? false
  );

  if (containsDisallowedKeyword) {
    return res.status(400).json({
      error: 'Query contains disallowed keywords for data modification'
    });
  }

  try {
    const connection = await pool.getConnection();
    try {
      console.log('Executing query:', query);

      const startTime = process.hrtime();
      const [rows, fields] = await connection.query(query);
      const endTime = process.hrtime(startTime);

      // Convert to milliseconds
      const executionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

      const columns = fields.map(field => field.name);
      console.log(`Query executed successfully in ${executionTime}ms`);

      res.json({
        columns,
        rows,
        executionTime: `${executionTime}ms`
      });
    } catch (error) {
      console.error('Query execution error:', error);
      res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: `Database connection error: ${error.message}` });
  }
});

// Mount the code execution router
app.use('/api/simulations', simulationRoutes);
app.use('/api/code', codeExecutionRouter);
app.use('/api/quiz', quizRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
      console.log(r.route.path)
  }
});


// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/api.practicalsystemdesign.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/api.practicalsystemdesign.com/fullchain.pem')
// };

// const server = https.createServer(options, app);

// server.listen(3001, '0.0.0.0', () => {  // Note: explicitly binding to all interfaces
//   console.log('HTTPS Server running on port 3001');
// });

// Add error handling
// server.on('error', (error) => {
//   console.error('Server error:', error);
// })

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

