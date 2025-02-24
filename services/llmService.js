// services/llmService.js
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeProblemAndSolution(problem, code, timeComplexity, spaceComplexity) {
  try {
    const systemPrompt = `You are an expert at analyzing code solutions and detecting AI-generated code. 
    You will analyze the given problem statement, solution code, and complexity claims.
    Respond with a JSON object containing your analysis. Please keep the explainations short and straight. Be strict but fair in your assessment.`;

    const userPrompt = `
    Problem Statement:
    ${problem.description}
    
    Example Test Case:
    Input: ${problem.example.input}
    Expected Output: ${problem.example.output}
    
    User's Solution:
    ${code}
    
    Time Complexity Claimed: ${timeComplexity}
    Space Complexity Claimed(excluding the output/return data): ${spaceComplexity}
    
    Please analyze:
    1. If the code appears to be AI-generated (look for patterns typical in LLM outputs)
    2. If the claimed time and space complexities are accurate also provide ideal time and space complexities(always provide ideal complexities)
    3. If the solution approach is reasonable for the problem
    
    Format your response as a JSON object with the following structure:
    {
      "isSuspicious": boolean,
      "suspicionLevel": "high" | "medium" | "low",
      "reasons": string[],
      "isTimeComplexityAccurate": boolean,
      "isSpaceComplexityAccurate": boolean,
      "actualTimeComplexity": string,
      "actualSpaceComplexity": string,
      "explanation": string
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;

  } catch (error) {
    console.error('LLM analysis error:', error);
    // Return a safe default if LLM analysis fails
    return {
      isSuspicious: false,
      suspicionLevel: "low",
      reasons: ["Failed to perform analysis"],
      isTimeComplexityAccurate: true,
      isSpaceComplexityAccurate: true,
      actualTimeComplexity: timeComplexity,
      actualSpaceComplexity: spaceComplexity,
      explanation: "Analysis service unavailable"
    };
  }
}

module.exports = { analyzeProblemAndSolution };