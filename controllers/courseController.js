// controllers/courseUserController.js
const CourseRegisteredUsers = require('../models/CourseRegisteredUsers');

// Register a new course user
exports.addCourseRegisteredUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    
    // Validate required fields
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: name, phone, email, and password' 
      });
    }
    
    // Check if email already exists
    const existingUser = await CourseRegisteredUsers.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email address.'
      });
    }
    
    // Create new user
    // Password will be automatically hashed by the pre-save middleware in the model
    const newUser = new CourseRegisteredUsers({
      name,
      phone,
      email,
      password
    });
    
    await newUser.save();
    
    // Return success without sending back the password
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('Error in addCourseRegisteredUser:', error);
    
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
        message: 'Email or phone number already in use'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user with the email and explicitly select password and salt fields
    const user = await CourseRegisteredUsers.findOne({ email }).select('+password +salt');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Return success with user data (excluding password and salt)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};