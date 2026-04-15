import axios from "axios";

// Using Open-Meteo (free, no API key needed)
export const getWeatherData = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    const response = await axios.get(url);

    const data = response.data.current_weather;

    // Convert real data into risk-friendly scale (0–100)
    const weatherScore = mapWeatherToRisk(data);

    return {
      temperature: data.temperature,
      windspeed: data.windspeed,
      weathercode: data.weathercode,
      weatherScore,
    };
  } catch (error) {
    console.error("Weather API Error:", error.message);
    return null;
  }
};

// ------------------------------
// MAP WEATHER → RISK SCORE
// ------------------------------
const mapWeatherToRisk = (data) => {
  // Simple logic (can improve later)
  if (!data) return 0;

  // Example logic:
  if (data.windspeed > 50) return 80;   // strong wind
  if (data.temperature > 40) return 70; // extreme heat
  if (data.weathercode > 60) return 75; // bad weather

  return 30; // normal
};