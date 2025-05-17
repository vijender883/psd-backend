// db/mongodb.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Enhanced MongoDB connection options
const mongoDbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase from default 10000ms
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 50, // Increase connection pool size
  minPoolSize: 10, // Maintain minimum connections
  family: 4 // Force IPv4
};

// Singleton connection
let dbConnection = null;

// Connect to MongoDB with retry functionality
const connectWithRetry = async (retryCount = 5, delay = 5000) => {
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MongoDB URI not found in environment variables');
    process.exit(1);
  }
  
  // If connection already exists and is connected, reuse it
  if (dbConnection && mongoose.connection.readyState === 1) {
    console.log('Reusing existing MongoDB connection');
    return dbConnection;
  }
  
  try {
    console.log('Attempting to connect to MongoDB...');
    
    dbConnection = await mongoose.connect(process.env.MONGODB_URI, mongoDbOptions);
    
    console.log('MongoDB Atlas connected successfully');
    const { host, name } = mongoose.connection;
    console.log(`Connected to database: ${name} at host: ${host}`);
    
    // Set up event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (!mongoose.connection.readyState) {
        setTimeout(() => connectWithRetry(), delay);
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
      setTimeout(() => connectWithRetry(), delay);
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return dbConnection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    
    if (retryCount > 0) {
      console.log(`Retrying connection in ${delay}ms... (${retryCount} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retryCount - 1, delay);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1); // Exit if cannot connect to database after retries
    }
  }
};

// Check connection status
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Export the connection function and mongoose instance
module.exports = {
  connect: connectWithRetry,
  mongoose,
  isConnected,
  getConnection: () => dbConnection
};