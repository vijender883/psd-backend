// utils/insertProblemToSimulation.js
/**
 * Script to insert a specific DSA question into a Simulation document in MongoDB.
 * * * Prerequisites:
 * 1. MongoDB server must be running and accessible.
 * 2. Mongoose must be installed (npm install mongoose).
 * 3. The local problems data must be available (problems.js).
 * 4. The Simulation Mongoose model must be available (Simulation.js).
 * 5. A .env file containing MONGODB_URI must be present.
 */

const mongoose = require('mongoose');
// Use dotenv to load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

// --- GLOBAL VARIABLES (Customize these before running) ---
// The ID of the simulation document you want to update.
const SIMULATION_ID = '2'; 
// The ID of the problem you want to insert (e.g., 'arraychunk', 'flattenobject').
const PROBLEM_ID = 'traffic_flow_analysis'; 
// --------------------------------------------------------

// Import the problem data and Mongoose model
const { problems } = require('../models/problems'); 
const Simulation = require('../models/Simulation'); 

/**
 * Executes the connection, data fetching, and update logic.
 */
async function uploadProblemToSimulation() {
    // Check for MongoDB URI in environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('FATAL ERROR: MONGODB_URI not found in environment variables. Please check your .env file.');
        return;
    }

    if (!problems[PROBLEM_ID]) {
        console.error(`Error: Problem ID '${PROBLEM_ID}' not found in problems.js.`);
        return;
    }

    try {
        // 1. Connect to MongoDB using the URI from .env
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully using .env credentials.');

        const problemData = problems[PROBLEM_ID];

        // 2. Find the target Simulation document
        const simulation = await Simulation.findOne({ simulationId: SIMULATION_ID });

        if (!simulation) {
            console.error(`Error: Simulation with ID '${SIMULATION_ID}' not found.`);
            return;
        }

        // 3. Check if the problem already exists
        const exists = simulation.dsa_questions.some(q => q.id === PROBLEM_ID);
        if (exists) {
            console.warn(`Problem ID '${PROBLEM_ID}' already exists in Simulation ID '${SIMULATION_ID}'. Aborting insertion.`);
            return;
        }

        // 4. Use the custom Mongoose method to push the new question
        await simulation.addDSAQuestion(problemData);
        
        console.log(`Successfully inserted problem '${PROBLEM_ID}' into simulation '${SIMULATION_ID}'.`);

    } catch (error) {
        console.error('An error occurred during the update process:', error.message);
    } finally {
        // 5. Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

uploadProblemToSimulation();
