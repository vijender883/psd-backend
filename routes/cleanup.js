const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CODE_EXECUTION_DIR = path.join(__dirname, 'temp');

async function killJavaProcesses() {
    try {
        // Try different commands to kill Java processes
        const commands = [
            'killall java 2>/dev/null || true',
            'pkill -f java 2>/dev/null || true',
            'kill $(ps aux | grep java | grep -v grep | awk "{print $2}") 2>/dev/null || true'
        ];

        for (const cmd of commands) {
            try {
                await execPromise(cmd);
            } catch (error) {
                // Ignore errors from individual commands
                console.log('Process cleanup attempt completed');
            }
        }
    } catch (error) {
        // Ignore overall errors from process cleanup
        console.log('Process cleanup completed with status');
    }
}

async function cleanupOldFiles() {
    try {
        // First attempt to kill any lingering Java processes
        await killJavaProcesses();
        
        // Then clean up files
        const files = await fs.readdir(CODE_EXECUTION_DIR);
        for (const file of files) {
            try {
                const filePath = path.join(CODE_EXECUTION_DIR, file);
                const stats = await fs.stat(filePath);
                
                // Remove files older than 1 hour
                if (Date.now() - stats.mtime.getTime() > 3600000) {
                    await fs.unlink(filePath);
                    console.log(`Cleaned up old file: ${file}`);
                }
            } catch (error) {
                console.log(`Skip file cleanup for ${file}: ${error.message}`);
            }
        }
    } catch (error) {
        console.log('Cleanup cycle completed with status');
    }
}

function initializeCleanupScheduler() {
    // Run cleanup every 15 minutes
    const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    console.log('Initializing cleanup scheduler');
    setInterval(() => {
        console.log('Running scheduled cleanup');
        cleanupOldFiles().catch(error => {
            console.log('Scheduled cleanup completed with status');
        });
    }, CLEANUP_INTERVAL);

    // Run initial cleanup
    cleanupOldFiles().catch(error => {
        console.log('Initial cleanup completed with status');
    });
}

module.exports = { initializeCleanupScheduler };
