// controllers/eventbotController.js
const EventBotRegisteredUsers = require('../models/EventBotRegisteredUsers');
const EventBotUserChats = require('../models/EventBotUserChats');
let io; // Will be set after import

// Function to set io from server.js
exports.setIo = (socketIo) => {
  io = socketIo;
};

// Register a new event user
exports.addRegisteredUser = async (req, res) => {
  try {
    const { name, additional_details } = req.body;
    
    // Validate required fields
    if (!name || !additional_details) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: name and additional_details' 
      });
    }
    
    // Check if user with the same name already exists
    const existingUser = await EventBotRegisteredUsers.findOne({ name });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this name is already registered. Please use a different name.'
      });
    }
    
    // Create new user
    const newUser = new EventBotRegisteredUsers({
      name,
      additional_details
    });
    
    await newUser.save();
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        name: newUser.name,
        additional_details: newUser.additional_details,
        checkin_status: newUser.checkin_status
      }
    });
  } catch (error) {
    console.error('Error in addRegisteredUser:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this name already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Get list of registered users
exports.getRegisteredUserList = async (req, res) => {
  try {
    // Log all users for debugging
    const allUsers = await EventBotRegisteredUsers.find();
    console.log('All users in DB:', allUsers);
    
    let query = {};
    
    // Check if name parameter exists and is not empty
    if (req.body && req.body.name !== undefined && req.body.name !== "") {
      // Create a case-insensitive regex query that matches any part of the name
      query = { 
        name: { $regex: new RegExp(req.body.name, 'i') }
      };
    }
    
    // Log the query being used
    console.log('Query:', JSON.stringify(query));
    
    // Find users based on the query
    const users = await EventBotRegisteredUsers.find(query);
    
    console.log('Matching users found:', users.length);
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error in getRegisteredUserList:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.validateRegisteredUserEmailId = async (req, res) => {
  try {
    // Log the incoming request for debugging
    console.log('Validating email request:', req.body);
    
    // Check if email parameter exists in the request body
    if (!req.body || !req.body.email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find a user with the provided email
    const user = await EventBotRegisteredUsers.findOne({ 
      email: req.body.email 
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    // Return appropriate response based on whether user exists
    if (user) {
      res.status(200).json({
        response: "registered",
        userData: {
          _id: user._id,          // Added user _id here
          userId: user._id,       // Also returning as userId for backward compatibility
          name: user.name,
          email: user.email,
          phone: user.phone,
          linkedinUrl: user.linkedinUrl,
          additional_details: user.additional_details,
          checkin_status: user.checkin_status
        }
      });
    } else {
      res.status(200).json({
        response: "not_registered"
      });
    }
  } catch (error) {
    console.error('Error in validateRegisteredUserEmailId:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// Updated checkinUser function with socket emit
exports.checkinUser = async (req, res) => {
  try {
    // Get userId from request body instead of params
    const { userId } = req.body;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find and update the user
    const updatedUser = await EventBotRegisteredUsers.findByIdAndUpdate(
      userId,
      { checkin_status: true },
      { new: true, runValidators: true }
    );
    
    // Check if user exists
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Emit socket message with check-in notification
    if (io) {
      console.log('Emitting checkin_notification event');
      io.emit('checkin_notification', {
        message: 'Tell me something about Sai Saketh Sukka'
      });
    } else {
      console.warn('Socket.io instance not available for emitting message');
    }
    
    res.status(200).json({
      success: true,
      message: 'User checked in successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in checkinUser:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.saveChat = async (req, res) => {
  try {
    const { userId, message, message_source } = req.body;
    
    // Validate required fields
    if (!userId || !message || !message_source) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: userId, message, and message_source' 
      });
    }
    
    // Find existing chat document for this user or create a new one
    let userChat = await EventBotUserChats.findOne({ userId });
    
    if (!userChat) {
      // Create new chat document if it doesn't exist
      userChat = new EventBotUserChats({ 
        userId,
        chats: []
      });
    }
    
    // Add new message to chats array
    userChat.chats.push({
      message_source,
      message,
      chat_time: new Date()
    });
    
    // Save the updated document
    await userChat.save();
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Chat saved successfully',
      data: {
        userId: userChat.userId,
        chatMessage: userChat.chats[userChat.chats.length - 1]
      }
    });
  } catch (error) {
    console.error('Error in saveChat:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Get chat history for a user
exports.getChatList = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find chats for this user
    const userChat = await EventBotUserChats.findOne({ userId });
    
    // If no chats found, return empty array
    if (!userChat) {
      return res.status(200).json({
        success: true,
        message: 'No chat history found for this user',
        data: {
          userId,
          chats: []
        }
      });
    }
    
    // Return chats
    res.status(200).json({
      success: true,
      count: userChat.chats.length,
      data: {
        userId: userChat.userId,
        chats: userChat.chats
      }
    });
  } catch (error) {
    console.error('Error in getChatList:', error);
    
    // Handle invalid ObjectId if userId is used as MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get total count of registered users
exports.getRegisteredUserCount = async (req, res) => {
  try {
    // Get count of all documents in the EventBotRegisteredUsers collection
    const count = await EventBotRegisteredUsers.countDocuments();
    
    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error in getRegisteredUserCount:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// Get count of checked-in users
// Get count of checked-in users
exports.getCheckedInUserCount = async (req, res) => {
  try {
    // Get count of documents where checkin_status is true
    const count = await EventBotRegisteredUsers.countDocuments({ checkin_status: true });
    
    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error in getCheckedInUserCount:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getCheckedInUsers = async (req, res) => {
  try {
    // Find all users where checkin_status is true, sort by updatedAt in descending order
    const checkedInUsers = await EventBotRegisteredUsers.find({ 
      checkin_status: true 
    })
    .sort({ updatedAt: -1 }) // -1 means descending order
    .select('name email phone additional_details updatedAt'); // Select relevant fields
    
    // Log the number of checked-in users found
    console.log(`Found ${checkedInUsers.length} checked-in users`);
    
    // Transform data to include formatted timestamps and IDs
    const formattedUsers = checkedInUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      additional_details: user.additional_details,
      timestamp: user.updatedAt
    }));
    
    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error in getCheckedInUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};