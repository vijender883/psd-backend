const fs = require('fs').promises;
const path = require('path');
const CODE_EXECUTION_DIR = path.join(__dirname, 'temp');

// Configuration
const CLEANUP_INTERVAL = 1000 * 60 * 1; // 15 minutes
const FILE_MAX_AGE = 1000 * 60 * 3; // 30 minutes

// Function to get file age in milliseconds
async function getFileAge(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return Date.now() - stats.mtimeMs;
    } catch (error) {
        console.error(`Error getting file age for ${filePath}:`, error);
        return Infinity; // Return Infinity so the file gets deleted if there's an error
    }
}

// Function to check if a file is a temporary Java file
function isTempJavaFile(fileName) {
    return (fileName.startsWith('Submission_') && 
           (fileName.endsWith('.java') || fileName.endsWith('.class')));
}

// Main cleanup function
async function cleanupTempFiles() {
    try {
        const files = await fs.readdir(CODE_EXECUTION_DIR);
        
        for (const file of files) {
            if (isTempJavaFile(file)) {
                const filePath = path.join(CODE_EXECUTION_DIR, file);
                const fileAge = await getFileAge(filePath);
                
                if (fileAge > FILE_MAX_AGE) {
                    try {
                        await fs.unlink(filePath);
                        console.log(`Cleaned up old temp file: ${file}`);
                    } catch (error) {
                        console.error(`Error deleting file ${file}:`, error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error during scheduled cleanup:', error);
    }
}

// Start the cleanup scheduler when the router is initialized
function initializeCleanupScheduler() {
    // Run initial cleanup
    cleanupTempFiles();
    
    // Schedule regular cleanup
    setInterval(cleanupTempFiles, CLEANUP_INTERVAL);
    
    console.log('Temporary file cleanup scheduler initialized');
}

module.exports = {
    initializeCleanupScheduler
};