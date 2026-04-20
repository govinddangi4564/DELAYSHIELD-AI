import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  backend: "gemini", // 🔥 ADD THIS LINE
});

export default ai;