import { calculateRisk } from "../engine/risk/riskengine.js";
import { makeDecision } from "../engine/decision/decisionengine.js";
import { getWeatherData } from "../integrations/weather.api.js";
import { getRoute } from "../integrations/route.api.js";
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
      traffic,
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

    if (
      decisionResult.action.includes("REROUTE") ||
      decisionResult.action.includes("HALT")
    ) {
      routeData = await getRoute(
        [lon, lat],        // start
        [endLon, endLat]   // destination
      );
    }

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