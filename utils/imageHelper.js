// utils/imageHelper.js

/**
 * Helper function to process S3 image URLs
 * @param {string} imageUrl - The image URL from the database
 * @return {string} - The processed public URL
 */
exports.getPublicImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL that's not a signed URL (doesn't contain X-Amz parameters)
  if (imageUrl.startsWith('http') && !imageUrl.includes('X-Amz')) {
    return imageUrl;
  }
  
  // If it's a key path (not a full URL)
  if (!imageUrl.startsWith('http')) {
    return `https://alumnxbucket01.s3.ap-south-1.amazonaws.com/${imageUrl}`;
  }
  
  // If it's a signed URL, extract the key and create a public URL
  try {
    // Extract the key from the URL up to the question mark
    const urlParts = imageUrl.split('?');
    const baseUrl = urlParts[0];
    
    // Return the base URL without the signed parameters
    return baseUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
};

/**
 * Helper function to transform existing fully signed URLs to public URLs
 * Only needed for transitioning existing data to the new format
 */
exports.migrateSignedUrlsToPublic = async (questionId) => {
  try {
    const Question = require('../models/Question');
    const question = await Question.findById(questionId);
    
    if (!question || !question.imageUrl) {
      return null;
    }
    
    // Skip if it's already in the correct format
    if (!question.imageUrl.includes('X-Amz')) {
      return question.imageUrl;
    }
    
    // Extract the file name from the URL
    const url = new URL(question.imageUrl);
    const path = url.pathname;
    const fileName = path.split('/').pop();
    
    // Create the new image path
    const newImagePath = `quiz-images/${fileName}`;
    
    // Update the question
    question.imageUrl = newImagePath;
    await question.save();
    
    console.log(`Migrated image URL for question ${questionId}`);
    return newImagePath;
  } catch (error) {
    console.error(`Error migrating image URL for question ${questionId}:`, error);
    return null;
  }
};