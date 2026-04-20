import { calculateRisk } from "../engine/risk/riskengine.js";
import { makeDecision } from "../engine/decision/decisionengine.js";
import { getWeatherData } from "../integrations/weather.api.js";
import { getRoute } from "../integrations/route.api.js";
import { calculateCostImpact } from "../engine/cost/costengine.js";
import { generateAIPlan } from "../engine/decision/aiplanner.js";
import { simulateTraffic } from "../utils/simulatetraffic.js";
// ------------------------------
// FULL PIPELINE CONTROLLER
// ------------------------------
export const analyzeShipment = async (req, res) => {
  try {
    const {
      traffic,
      delay,
      lat,
      lon,
      endLat = 22.7196, // default (Indore)
      endLon = 75.8577,
      priority = "Medium",
    } = req.body;

    // If traffic not provided → simulate it
const finalTraffic =
  traffic ?? simulateTraffic("medium", 30, "Bhopal");
  
    // Validate location
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    // ------------------------------
    // STEP 1: WEATHER
    // ------------------------------
    const weatherData = await getWeatherData(lat, lon);

    if (!weatherData) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch weather data",
      });
    }

    const weather = weatherData.weatherScore;

    // ------------------------------
    // STEP 2: RISK
    // ------------------------------
    const riskResult = calculateRisk({
      traffic: finalTraffic,
      weather,
      delay,
    });

    // ------------------------------
    // STEP 3: DECISION
    // ------------------------------
    const decisionResult = makeDecision(riskResult);

    // ------------------------------
    // STEP 4: ROUTE (🔥 NEW)
    // ------------------------------
    let routeData = null;
    let aiRouteSuggestion = null;
    if (
      decisionResult.action.includes("REROUTE") ||
      decisionResult.action.includes("HALT")
    ){
      try {
        routeData = await getRoute(
          [lon, lat],        // start
          [endLon, endLat]   // destination
        );

        // placeholder for AI-enhanced routing later
        aiRouteSuggestion = "Optimized Highway Route";
      } catch (err) {
        console.error("Route fetch failed:", err.message);
        routeData = null;
      }
    }
    // ------------------------------
    // STEP 5: COST (🔥 YOUR ENGINE)
    // ------------------------------
    const costResult = calculateCostImpact({
      delay,
      priority,
      riskLevel: riskResult.level,
      routeData,
      aiRouteSuggestion,
    });

     // ------------------------------
    // STEP 6: AI PLANNER
    // ------------------------------
    const aiResult = await generateAIPlan({
  risk: {
    ...riskResult,
    traffic,
    delay,
  },
  decision: decisionResult,
  route: routeData,
  cost: costResult,
});
    
    // ------------------------------
    // FINAL RESPONSE
    // ------------------------------
    return res.status(200).json({
      success: true,

      input: {
        traffic,
        delay,
        location: { lat, lon },
        destination: { lat: endLat, lon: endLon },
        priority,
      },

      weather: weatherData,
      risk: riskResult,
      decision: decisionResult,

      route: routeData, // 🔥 NEW ADDITION
      cost: costResult,
      ai: aiResult?.data || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pipeline error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};