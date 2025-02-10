const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const allowedOrigins = [
  'http://localhost:3000',  // Local development
  'https://your-frontend-domain.com', // Your production frontend URL
  'https://psd-code-ekqy89w97-vijenders-projects-8199b04c.vercel.app',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
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


  app.post('/api/verify-token', (req, res) => {
    const { token } = req.body;
    
    // Replace this with your actual token verification logic
    const isValidToken = token === process.env.ACCESS_TOKEN;
    
    res.json({ valid: isValidToken });
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});