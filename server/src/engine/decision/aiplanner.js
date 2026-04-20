/**
 * aiPlanner.js
 * AI-powered logistics route planner for DelayShield AI.
 * Uses Google Gemini via external config.
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ─────────────────────────────────────────────
// UNIT CONVERTERS
// ─────────────────────────────────────────────

const toKm = (meters) =>
  Math.round((meters / 1000) * 100) / 100;

const toHours = (seconds) =>
  Math.round((seconds / 3600) * 100) / 100;

// ─────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────

const buildPrompt = ({ risk, decision, route, cost }) => {
  const routeSection = route
    ? `- Distance : ${toKm(route.distance)} km
- Duration : ${toHours(route.duration)} hours`
    : "- Route data : Not available";

  const costSection = cost
    ? `- No-action cost : ₹${cost.noActionCost}
- Reroute cost   : ${
        cost.rerouteCost !== null ? `₹${cost.rerouteCost}` : "Not available"
      }
- Savings        : ${
        cost.savings !== null ? `₹${cost.savings}` : "Not available"
      }`
    : "- Cost data : Not available";

  return `
You are an expert logistics AI planner for "DelayShield AI".

Analyze the shipment data and generate an optimal routing strategy.

SHIPMENT CONDITIONS:
- Risk Level  : ${risk.level}
- Risk Score  : ${risk.score} 
- Traffic     : ${risk.traffic ?? "N/A"}
- Delay       : ${risk.delay ?? "N/A"}
- Decision    : ${decision.action}

ROUTE DATA:
${routeSection}

COST ANALYSIS:
${costSection}

RULES:

1. HIGH risk:
   - MUST REROUTE
   - Choose fastest NH route even if cost is higher

2. MEDIUM risk:
   - Compare savings
   - Suggest REROUTE or MONITOR
   - Provide 2 alternative routes

3. LOW risk:
   - CONTINUE current route
   - Avoid unnecessary rerouting

4. If savings > 0 → prefer REROUTE
5. If reroute cost is higher → explain trade-off clearly

6. Use Indian highways:
   NH44, NH46, NH48, NH52, Expressway, Bypass

7. ALWAYS suggest:
   - 1 main NH route
   - 2 alternatives (NH / bypass / expressway)

----------------------------------
IMPORTANT
----------------------------------
Return ONLY valid JSON.
Do NOT include explanation or markdown.

{
  "suggestedRoute": "string",
  "alternatives": ["string", "string"],
  "decision": "REROUTE | MONITOR | CONTINUE",
  "reason": "string",
  "tradeOff": "string",
  "priorityAction": "string",
  "confidence": "High | Medium | Low"
}
`.trim();
};

// ─────────────────────────────────────────────
// RESPONSE PARSER
// ─────────────────────────────────────────────

const parseResponse = (rawText) => {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned);
};

// ─────────────────────────────────────────────
// VALIDATORS
// ─────────────────────────────────────────────

const validateInput = (input) => {
  if (!input?.risk?.level || typeof input.risk.score !== "number") {
    throw new Error("Invalid risk input");
  }
  if (!input?.decision?.action) {
    throw new Error("Invalid decision input");
  }
};

const validateOutput = (parsed) => {
  if (
  !parsed.suggestedRoute ||
  !parsed.decision ||
  !parsed.reason ||
  !parsed.confidence
) {
  throw new Error("Invalid AI output format");
}
};

// ─────────────────────────────────────────────
// FALLBACK
// ─────────────────────────────────────────────

const fallbackResponse = (input) => ({
  success: false,
  data: {
    suggestedRoute: "Continue current route",
    alternatives: [],
    decision: input?.decision?.action || "MONITOR",
    reason: "AI unavailable, fallback used",
    tradeOff: "No AI analysis available",
    priorityAction: "Monitor conditions manually",
    confidence: "Low",
  },
});

// ─────────────────────────────────────────────
// CORE FUNCTION
// ─────────────────────────────────────────────

export const generateAIPlan = async (input = {}) => {
  try {
    // Step 1: Validate input
    validateInput(input);

    // Step 2: Build prompt
    const prompt = buildPrompt({
      risk: input.risk,
      decision: input.decision,
      route: input.route ?? null,
      cost: input.cost ?? null,
    });

    // Step 3: Call Gemini
console.log("API KEY:", process.env.GEMINI_API_KEY);

    const result = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: prompt,
});

const text = result.text;

    if (!text) throw new Error("Empty AI response");

    // Step 4: Parse response
    const parsed = parseResponse(text);

    // Step 5: Validate output
    validateOutput(parsed);

    return {
      success: true,
      data: parsed,
    };

  } catch (error) {
    console.error("[aiPlanner] Error:", error.message);
    return fallbackResponse(input);
  }
};