// models/Question.js
// Defines the Question schema with options and correct answer
const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    options: [
      {
        text: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    timeLimit: {
      type: Number, // Time in seconds
      required: true,
    },
    order: {
      type: Number, // Question order in the quiz
      required: true,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Add virtual property for public URL
QuestionSchema.virtual("imagePublicUrl").get(function () {
  if (!this.imageUrl) return null;

  // If it's already a full URL that's not a signed URL (doesn't contain X-Amz parameters)
  if (this.imageUrl.startsWith("http") && !this.imageUrl.includes("X-Amz")) {
    return this.imageUrl;
  }

  // If it's a key path (not a full URL)
  if (!this.imageUrl.startsWith("http")) {
    return `https://alumnxbucket01.s3.ap-south-1.amazonaws.com/${this.imageUrl}`;
  }

  // If it's a signed URL, extract the key and create a public URL
  try {
    // Extract the key from the URL up to the question mark
    const urlParts = this.imageUrl.split("?");
    const baseUrl = urlParts[0];

    // Return the base URL without the signed parameters
    return baseUrl;
  } catch (error) {
    console.error("Error processing image URL:", error);
    return null;
  }
});

module.exports = mongoose.model("Question", QuestionSchema);
