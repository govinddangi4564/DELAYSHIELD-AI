import { calculateRisk } from "../engine/risk/riskengine.js";
import { getWeatherData } from "../integrations/weather.api.js";
// ------------------------------
// INPUT VALIDATION
// ------------------------------
const isValidNumber = (val) =>
  val === undefined || (typeof val === "number" && val >= 0 && val <= 100);

// ------------------------------
// CONTROLLER
// ------------------------------
export const analyzeRisk = async (req, res) => {
  try {
    const { traffic, delay, lat, lon } = req.body;

    // Require location for weather
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    // Fetch real weather data
    const weatherData = await getWeatherData(lat, lon);

    if (!weatherData) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch weather data",
      });
    }

    const weather = weatherData.weatherScore;

    // Validate inputs
    if (!isValidNumber(traffic) || !isValidNumber(delay)) {
      return res.status(400).json({
        success: false,
        message: "Traffic and delay must be between 0–100",
      });
    }

    console.log("Inputs:", { traffic, weather, delay });

    // Calculate risk using real weather
    const result = calculateRisk({
      traffic,
      weather,
      delay,
    });

    return res.status(200).json({
      success: true,
      data: result,
      weather: weatherData, // 🔥 send real data too
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Risk error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};