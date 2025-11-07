// in lib/ai/client.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Get the API Key and handle the error centrally.
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("CRITICAL: GEMINI_API_KEY environment variable is not set.");
}

// 2. Initialize the main AI client once.
const genAI = new GoogleGenerativeAI(apiKey);

// 3. Get specific model instances. 
//    Note: I've corrected the model names to the current official ones.

const genAIPro = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const genAIFlash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 4. Use named exports.
export { genAIPro, genAIFlash };