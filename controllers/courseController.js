// controllers/courseUserController.js
const CourseRegisteredUsers = require("../models/CourseRegisteredUsers");
const emailService = require("../services/emailService");

// Register a new course user
exports.addCourseRegisteredUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, phone, email, and password",
      });
    }

    // Check if email already exists
    const existingUser = await CourseRegisteredUsers.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email already registered. Please use a different email address.",
      });
    }

    // Create new user
    const newUser = new CourseRegisteredUsers({
      name,
      phone,
      email,
      password,
    });

    await newUser.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        name,
        email,
        phone,
      });
      console.log("Welcome email sent to:", email);
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error("Error sending welcome email:", emailError);
    }

    // Return success without sending back the password
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("Error in addCourseRegisteredUser:", error);

    // Handle specific validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already in use",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
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
        message: "Please provide email and password",
      });
    }

    // Find user with the email and explicitly select password and salt fields
    const user = await CourseRegisteredUsers.findOne({ email }).select(
      "+password +salt"
    );

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return success with user data (excluding password and salt)
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Dispatch emails to multiple recipients
exports.dispatchEmail = async (req, res) => {
  try {
    const { templateId, emailList, mergeInfo } = req.body;

    // Validate required fields
    if (!templateId || !emailList) {
      return res.status(400).json({
        success: false,
        message: "Template ID and email list are required",
      });
    }

    // Validate template ID format (basic check)
    if (typeof templateId !== "string" || templateId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID format",
      });
    }

    // Validate email list format
    if (typeof emailList !== "string" || emailList.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid email list format",
      });
    }

    // Count valid emails before sending
    const emails = emailList
      .split(";")
      .map((email) => email.trim())
      .filter(
        (email) => email !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses found in the email list",
      });
    }

    // Dispatch emails using the email service
    const response = await emailService.dispatchEmails({
      templateId: templateId.trim(),
      emailList: emailList.trim(),
      mergeInfo: mergeInfo || {},
    });

    console.log(
      `Emails dispatched successfully to ${emails.length} recipients using template: ${templateId}`
    );

    res.status(200).json({
      success: true,
      message: "Emails dispatched successfully",
      data: {
        templateId: templateId.trim(),
        recipientCount: emails.length,
        recipients: emails,
        zeptoResponse: response,
      },
    });
  } catch (error) {
    console.error("Error in dispatchEmail:", error);

    // Handle specific ZeptoMail errors
    if (error.message && error.message.includes("template")) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID or template not found",
        error: error.message,
      });
    }

    if (error.message && error.message.includes("email")) {
      return res.status(400).json({
        success: false,
        message: "Email validation error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error while dispatching emails",
      error: error.message,
    });
  }
};
