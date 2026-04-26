import dotenv from 'dotenv'
import { generateContentWithModelFallback } from './geminiModel.js'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * The prompt instructs Gemini to return a single, flat JSON object
 * containing both the shipment data AND the AI insights,
 * exactly matching the frontend's MOCK_SHIPMENTS + MOCK_AI_INSIGHTS shape.
 */
const SYSTEM_PROMPT = `You are the DelayShield Shipment Intelligence Engine.

Given an origin city and a destination city, generate a COMPLETE, realistic logistics shipment analysis, including a comparison of different transport modes.

You must respond ONLY with a valid JSON object. No markdown, no explanation, no extra text.

The JSON must have this EXACT structure:

{
  "shipment": {
    "id": "SHP-XXXXX",
    "origin": { "name": "City, State", "lat": 0.0, "lng": 0.0 },
    "destination": { "name": "City, State", "lat": 0.0, "lng": 0.0 },
    "status": "In Transit",
    "currentLocation": { "lat": 0.0, "lng": 0.0 },
    "etas": { "original": "HH:MM TZ", "updated": "HH:MM TZ" },
    "riskFactors": { "traffic": 0, "weather": 0, "delay": 0 },
    "riskScore": "Low",
    "currentCost": 0,
    "potentialLoss": 0
  },
  "insights": {
    "summary": "string",
    "dominantFactor": "string",
    "explanation": "string",
    "keyFactors": ["string", "string", "string", "string"],
    "actions": [
      {
        "type": "Reroute",
        "description": "string",
        "tradeOff": "string",
        "costImpact": "string",
        "recommended": true
      },
      {
        "type": "Monitor",
        "description": "string",
        "tradeOff": "string",
        "costImpact": "string",
        "recommended": false
      }
    ]
  },
  "routeHistory": {
    "route": "Origin → Destination via Highway",
    "decision": "Reroute",
    "riskLevel": "High",
    "costImpact": "+INR XXX"
  },
  "modeComparison": {
    "air": {
      "mode": "Air",
      "icon": "✈️",
      "available": true,
      "transitTime": "string",
      "baseCost": 0,
      "fuelSurcharge": 0,
      "totalCost": 0,
      "riskScore": 0,
      "riskLevel": "string",
      "co2Emissions": 0,
      "reliabilityScore": 0,
      "onTimePercent": 0,
      "recommendedFor": "string",
      "bestForBadge": "string",
      "pros": ["string", "string", "string"],
      "cons": ["string", "string", "string"]
    },
    "ocean": { "mode": "Ocean", "icon": "🚢", "available": true, "transitTime": "string", "baseCost": 0, "fuelSurcharge": 0, "totalCost": 0, "riskScore": 0, "riskLevel": "string", "co2Emissions": 0, "reliabilityScore": 0, "onTimePercent": 0, "recommendedFor": "string", "bestForBadge": "string", "pros": ["string", "string", "string"], "cons": ["string", "string", "string"] },
    "road": { "mode": "Road", "icon": "🚛", "available": true, "transitTime": "string", "baseCost": 0, "fuelSurcharge": 0, "totalCost": 0, "riskScore": 0, "riskLevel": "string", "co2Emissions": 0, "reliabilityScore": 0, "onTimePercent": 0, "recommendedFor": "string", "bestForBadge": "string", "pros": ["string", "string", "string"], "cons": ["string", "string", "string"] },
    "recommendation": {
      "bestOverall": "string",
      "reasoning": "string",
      "bestForCost": "string",
      "bestForSpeed": "string",
      "bestForSustainability": "string"
    }
  }
}

RULES:
1. "id" must be "SHP-" followed by a random 5-digit number.
2. Coordinates (lat/lng) must be real, accurate coordinates for the given cities.
3. "currentLocation" must be a realistic in-transit point between origin and destination (roughly 30-60% along the route).
4. "status" must be one of: "In Transit", "Delayed", "On Time", "High Risk", "Monitoring".
5. "riskFactors" values must be integers 0-100 representing percentage scores.
6. "riskScore" must be one of: "Low", "Medium", "High", "Critical" — based on the riskFactors.
7. "currentCost" is the current shipping cost in INR (realistic, typically 40000-400000).
8. "potentialLoss" is the potential financial loss if things go wrong (in INR).
9. ETAs must use realistic timezone abbreviations (EST, CST, PST, IST, etc.).
10. "actions" must contain exactly 2 action objects. The "type" must be one of: "Reroute", "Monitor", "Delay", "Continue". Exactly one must have "recommended": true.
11. "costImpact" should be formatted like "+ INR 180" or "- INR 0" or "+ INR 95".
12. "keyFactors" must be an array of exactly 4 short tags like ["Traffic", "Delay", "SLA", "Cost"].
13. "explanation" should be 2-3 sentences explaining the AI's analysis reasoning.
14. "routeHistory.decision" must be one of: "Reroute", "Monitor", "Delay", "Continue".
15. For "modeComparison":
    - "available": Set to false if a mode is impossible (e.g., Road for trans-oceanic).
    - "transitTime": Use human readable formats like "2 hours", "14 days".
    - "riskLevel": "Low" | "Medium" | "High" | "Critical".
    - "bestForBadge": "Fastest" | "Cheapest" | "Most Reliable" | "Eco Friendly".
    - "pros"/"cons": Exactly 3 items each.
    - Costs and CO2 must be realistic based on origin/destination distance.
16. All values must be geographically and logistically realistic for the given origin and destination.`

function buildPrompt(origin, destination) {
  return `${SYSTEM_PROMPT}

Analyze a shipment from "${origin}" to "${destination}".
Generate the complete JSON response now.`
}

/**
 * Validates the parsed shipment+insights payload from Gemini.
 */
function validatePayload(data) {
  // Shipment validation
  const s = data.shipment
  if (!s) throw new Error('Missing "shipment" object')
  if (typeof s.id !== 'string' || !s.id.startsWith('SHP-')) throw new Error('Invalid shipment.id')
  if (!s.origin?.name || !s.origin?.lat || !s.origin?.lng) throw new Error('Invalid shipment.origin')
  if (!s.destination?.name || !s.destination?.lat || !s.destination?.lng) throw new Error('Invalid shipment.destination')
  if (!s.currentLocation?.lat || !s.currentLocation?.lng) throw new Error('Invalid shipment.currentLocation')
  if (!s.etas?.original || !s.etas?.updated) throw new Error('Invalid shipment.etas')
  if (!['Low', 'Medium', 'High', 'Critical'].includes(s.riskScore)) throw new Error('Invalid shipment.riskScore')

  // Insights validation
  const i = data.insights
  if (!i) throw new Error('Missing "insights" object')
  if (typeof i.summary !== 'string' || !i.summary.trim()) throw new Error('Invalid insights.summary')
  if (typeof i.explanation !== 'string' || !i.explanation.trim()) throw new Error('Invalid insights.explanation')
  if (!Array.isArray(i.actions) || i.actions.length < 2) throw new Error('insights.actions must have at least 2 items')
  if (!Array.isArray(i.keyFactors) || i.keyFactors.length === 0) throw new Error('insights.keyFactors must be a non-empty array')

  // Mode comparison validation
  const mc = data.modeComparison
  if (!mc) throw new Error('Missing "modeComparison" object')
  if (!mc.air || !mc.ocean || !mc.road) throw new Error('Missing modes in modeComparison')
  if (!mc.recommendation) throw new Error('Missing recommendation in modeComparison')
}

/**
 * Main export: generates a full shipment + insights using Gemini AI.
 * @param {string} origin  – Starting location, e.g. "Los Angeles, CA"
 * @param {string} destination – Destination, e.g. "New York, NY"
 * @returns {{ success: boolean, data: object }}
 */
export const generateShipment = async (origin, destination) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('AI_KEY_NOT_CONFIGURED')
    }

    const prompt = buildPrompt(origin, destination)
    const { result, modelName } = await generateContentWithModelFallback({
      apiKey: GEMINI_API_KEY,
      prompt,
      signal: controller.signal,
      retriesPerModel: 1,
      retryDelayMs: 1200
    })
    clearTimeout(timeoutId)

    const rawText = result.response.text()
    // Extract JSON from potential markdown fences
    const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1)
    const parsed = JSON.parse(jsonStr)

    // Override the LLM-generated ID to guarantee uniqueness and prevent duplicate key errors
    parsed.shipment.id = `SHP-${Math.floor(10000 + Math.random() * 90000)}`

    validatePayload(parsed)

    return {
      success: true,
      data: parsed,
      meta: {
        model: modelName
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[shipmentGenerator] Error:', error.message)
    throw error
  }
}
