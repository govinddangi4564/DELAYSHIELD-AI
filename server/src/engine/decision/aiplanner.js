import dotenv from "dotenv";
import { generateContentWithModelFallback } from "./geminiModel.js";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are the DelayShield SLA Recovery Planner AI. Your objective is to analyze SLA risk telemetry and recommend optimal recovery actions to prevent SLA breaches.

RECOVERY RULES to strictly follow:
- If Warehouse > 80, Recommend: "Switch Warehouse"
- If Traffic > 80, Recommend: "Alternative Route"
- If SLA Risk > 90, Recommend: "Priority Processing"

You must respond ONLY with a valid JSON object matching this exact schema. Do not include markdown formatting, conversational text, or any other output.

{
  "primaryCause": "String (The main factor driving the SLA risk, e.g. 'Warehouse Congestion')",
  "recommendedActions": [
    "String (Specific actionable recommendation 1)",
    "String (Specific actionable recommendation 2)"
  ],
  "suggestedRoute": "String (Specific National Highway (NH) or Alternative Path)",
  "recoveryReasoning": "String (1-2 sentence explanation of why these actions were chosen)"
}`;

function buildPrompt(origin, destination, telemetry) {
  return `${SYSTEM_PROMPT}

Route: ${origin} to ${destination}.
Telemetry Data:
- SLA Risk Score: ${telemetry.slaRisk}/100
- Traffic Congestion: ${telemetry.traffic}%
- Warehouse Utilization: ${telemetry.warehouse}%
- Historical Delay Factor: ${telemetry.historicalDelay}%

Provide your strategic JSON assessment for SLA recovery.`;
}

export const generateAIPlan = async (input = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const { 
    slaRisk = 0,
    traffic = 0,
    warehouse = 0,
    historicalDelay = 0,
    shipmentId = "SHP-0", 
    origin = "Origin", 
    destination = "Destination" 
  } = input;

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("AI_KEY_NOT_CONFIGURED");
    }

    const telemetry = { slaRisk, traffic, warehouse, historicalDelay };
    const prompt = buildPrompt(origin, destination, telemetry);

    const { result } = await generateContentWithModelFallback({
      apiKey: GEMINI_API_KEY,
      prompt,
      signal: controller.signal,
      retriesPerModel: 1,
      retryDelayMs: 800
    });
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
        shipmentId
      }
    };

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[aiplanner] Fallback triggered:", error.message);

    // Safe fallback so the engine doesn't crash
    return {
      success: false,
      data: {
        primaryCause: "System Telemetry Unavailable",
        recommendedActions: ["Monitor Conditions Manually", "Alert Dispatcher"],
        suggestedRoute: "Current Baseline Route",
        recoveryReasoning: "Neural link unavailable. Defaulting to standard operational protocols.",
        shipmentId
      }
    };
  }
};

function validateAIPayload(payload) {
  const requiredStrings = ["primaryCause", "suggestedRoute", "recoveryReasoning"];
  for (const field of requiredStrings) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      throw new Error(`AI payload missing or invalid field: "${field}"`);
    }
  }

  if (!Array.isArray(payload.recommendedActions) || payload.recommendedActions.length === 0) {
    throw new Error('AI payload missing required "recommendedActions" array.');
  }
}
