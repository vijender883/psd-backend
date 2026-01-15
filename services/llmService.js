// services/llmService.js
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeProblemAndSolution(
  problem,
  code,
  timeComplexity,
  spaceComplexity,
  language = "java"
) {
  console.log(
    `[LLM] Starting analyzeProblemAndSolution for problem: ${problem.id}`
  );
  console.log(
    `[LLM] Code length: ${code.length} characters, Language: ${language}`
  );
  console.log(
    `[LLM] Claimed time complexity: ${timeComplexity}, space complexity: ${spaceComplexity}`
  );

  try {
    console.time("[LLM] OpenAI API call");

    const systemPrompt = `You are an expert at analyzing code solutions. 
    You will analyze the given problem statement, solution code (in ${language}), and complexity claims.
    Respond with a JSON object containing your analysis. Please keep the explanations short and straight. Be strict but fair in your assessment.`;

    const userPrompt = `
    Problem Statement:
    ${problem.description}
    
    Example Test Case:
    Input: ${problem.example.input}
    Expected Output: ${problem.example.output}
    
    User's Solution (${language}):
    ${code}
    
    Time Complexity Claimed: ${timeComplexity}
    Space Complexity Claimed(excluding the output/return data): ${spaceComplexity}
    
    Please analyze:
    1. If the claimed time and space complexities(compare them to user code only not ideal complexities) are accurate also provide actual time and space complexities(of the user's code)
    2. If the solution approach is reasonable for the problem and how it can be improved (explain the algorithm, in short), remember to always refer to the user's code while providing improvements
    3. Optimize the solution if possible(code)
    
    Format your response as a JSON object with the following structure:
    {
      "improvement": string,
      "isTimeComplexityAccurate": boolean,
      "isSpaceComplexityAccurate": boolean,
      "actualTimeComplexity": string,
      "actualSpaceComplexity": string,
      "explanation": string,
      "optimizedSolution": string
    }`;

    console.log(
      `[LLM] Sending request to OpenAI API (model: gpt-4-turbo-preview)`
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    console.timeEnd("[LLM] OpenAI API call");
    console.log(
      `[LLM] Received response from OpenAI API, token usage: ${
        response.usage
          ? `${response.usage.prompt_tokens} prompt tokens, ${response.usage.completion_tokens} completion tokens`
          : "Usage data not available"
      }`
    );

    const analysisText = response.choices[0].message.content;
    console.log(
      `[LLM] Raw response (first 300 chars): ${analysisText.substring(
        0,
        300
      )}...`
    );

    const analysis = JSON.parse(analysisText);

    console.log("[LLM] Analysis results:");
    console.log(
      `[LLM] - Time complexity accurate: ${analysis.isTimeComplexityAccurate}`
    );
    console.log(
      `[LLM] - Space complexity accurate: ${analysis.isSpaceComplexityAccurate}`
    );
    console.log(
      `[LLM] - Actual time complexity: ${analysis.actualTimeComplexity}`
    );
    console.log(
      `[LLM] - Actual space complexity: ${analysis.actualSpaceComplexity}`
    );
    console.log(
      `[LLM] - Has improvement suggestion: ${!!analysis.improvement}`
    );
    console.log(
      `[LLM] - Has optimized solution: ${!!analysis.optimizedSolution}`
    );

    return analysis;
  } catch (error) {
    console.error("[LLM] Analysis error:", error);
    console.log("[LLM] Returning default analysis due to error");

    // Return a safe default if LLM analysis fails
    return {
      improvement: "Unable to analyze the code due to service error",
      isTimeComplexityAccurate: true,
      isSpaceComplexityAccurate: true,
      actualTimeComplexity: timeComplexity,
      actualSpaceComplexity: spaceComplexity,
      explanation: "Analysis service unavailable: " + error.message,
      optimizedSolution: "// Original code (analysis failed)\n" + code,
    };
  }
}

module.exports = { analyzeProblemAndSolution };
