import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the DelayShield Tactical AI. Your objective is to analyze logistics telemetry and provide strategic routing decisions.

You must respond ONLY with a valid JSON object matching this exact schema. Do not include markdown formatting, conversational text, or any other output.

{
  "summary": "Short headline for the Alert System (max 6 words)",
  "explanation": "1-2 sentence tactical reasoning for the Decision Panel.",
  "dominantFactor": "String (e.g. Traffic Saturation, Weather Anomaly)",
  "identifiedHighways": ["String", "String"],
  "actions": [
    {
      "type": "REROUTE | MONITOR | CONTINUE",
      "description": "Specific action instructions",
      "tradeOff": "Pro/Con analysis",
      "recommended": true
    }
  ]
}`;

function buildPrompt(origin, destination, risk, decision) {
  return `${SYSTEM_PROMPT}

Route: ${origin} to ${destination}.
Telemetry: Risk Score ${risk.score}/100, Traffic ${risk.traffic}%, Delay Prob ${risk.delay}%.
System Baseline Decision: ${decision.action}.
Identify specific National Highways (NH) or bypasses suitable for this route and provide your JSON assessment.`;
}

export const generateAIPlan = async (input = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const { 
    risk = {}, 
    decision = {}, 
    shipmentId = "SHP-0", 
    origin = "Origin", 
    destination = "Destination" 
  } = input;

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("AI_KEY_NOT_CONFIGURED");
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(origin, destination, risk, decision);

    // Execute with timeout protection
    const result = await model.generateContent(prompt, { signal: controller.signal });
    console.log("The Gemini response is:", result);
    clearTimeout(timeoutId);

    const rawText = result.response.text();
    const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
    
    const parsed = JSON.parse(jsonStr);

    // Strict validation
    validateAIPayload(parsed);

    return {
      success: true,
      data: {
        ...parsed,
        shipmentId,
        confidence: "High",
        suggestedRoute: parsed.identifiedHighways?.[0] || "Optimized Path"
      }
    };

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[aiplanner] Fallback triggered:", error.message);

    // Return the safe fallback so the dashboard doesn't crash
    const action = decision?.action || 'MONITOR';
    return {
      success: false,
      data: {
        summary: action === "REROUTE" ? "Strategic Corridor Shift" : "Tactical Monitoring Active",
        explanation: "Neural link unavailable. System operating on high-fidelity heuristic protocols for schedule integrity.",
        dominantFactor: "Connectivity Gap",
        identifiedHighways: ["NH Corridor"],
        actions: [{ type: action, description: "Follow standard operational protocols", tradeOff: "Reliability priority", recommended: true }]
      }
    };
  }
};

function validateAIPayload(payload) {
  const requiredStrings = ["summary", "explanation", "dominantFactor"];
  for (const field of requiredStrings) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      throw new Error(`AI payload missing or invalid field: "${field}"`);
    }
  }

  if (!Array.isArray(payload.identifiedHighways) || payload.identifiedHighways.length === 0) {
    throw new Error('AI payload missing required "identifiedHighways" array.');
  }

  if (!Array.isArray(payload.actions) || payload.actions.length === 0) {
    throw new Error('AI payload missing required "actions" array.');
  }

  for (const [i, action] of payload.actions.entries()) {
    const validTypes = ["REROUTE", "MONITOR", "CONTINUE"];
    if (!validTypes.includes(action.type)) {
      throw new Error(`Action[${i}].type is invalid: "${action.type}". Must be one of ${validTypes.join(", ")}.`);
    }
    if (typeof action.description !== "string") {
      throw new Error(`Action[${i}].description must be a string.`);
    }
    if (typeof action.tradeOff !== "string") {
      throw new Error(`Action[${i}].tradeOff must be a string.`);
    }
    if (typeof action.recommended !== "boolean") {
      throw new Error(`Action[${i}].recommended must be a boolean.`);
    }
  }
}
