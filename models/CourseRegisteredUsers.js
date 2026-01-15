// models/CourseRegisteredUsers.js
const mongoose = require("mongoose");
const crypto = require("crypto"); // Built-in Node.js module, no need to install

const CourseRegisteredUsersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // This ensures password isn't included in query results by default
    },
    salt: {
      type: String,
      select: false, // Hide salt from query results
    },
  },
  { timestamps: true }
);

// Create indexes for efficient lookups
CourseRegisteredUsersSchema.index({ email: 1 });
CourseRegisteredUsersSchema.index({ phone: 1 });

// Pre-save hook to hash the password before saving
CourseRegisteredUsersSchema.pre("save", function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified("password")) return next();

  try {
    // Generate a random salt
    this.salt = crypto.randomBytes(16).toString("hex");

    // Hash the password using the salt
    this.password = crypto
      .pbkdf2Sync(this.password, this.salt, 1000, 64, "sha512")
      .toString("hex");

    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password
CourseRegisteredUsersSchema.methods.comparePassword = function (
  candidatePassword
) {
  // Hash the candidate password with the same salt
  const hashedPassword = crypto
    .pbkdf2Sync(candidatePassword, this.salt, 1000, 64, "sha512")
    .toString("hex");

  // Compare with stored hash
  return this.password === hashedPassword;
};

module.exports = mongoose.model(
  "CourseRegisteredUsers",
  CourseRegisteredUsersSchema
);
