// controllers/eventbotController.js
const EventBotRegisteredUsers = require('../models/EventBotRegisteredUsers');

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
    const users = await EventBotRegisteredUsers.find();
    
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