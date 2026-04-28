import { cities } from "../data/cities.js";
import { simulateTraffic } from "../utils/simulatetraffic.js";

const cityTiers = new Map([
  ["Bhopal", 2],
  ["Indore", 2],
  ["Delhi", 1],
  ["Mumbai", 1],
  ["Bangalore", 1],
  ["Chennai", 1],
  ["Hyderabad", 1],
  ["Ahmedabad", 1],
  ["Pune", 2],
  ["Jaipur", 2],
]);

// GET: City traffic (for map)
export const getCityTraffic = (req, res) => {
  try {
    const { cities: userCities = [] } = req.body || {};

    const result = cities.map((city) => {
      // Check if user provided traffic for this city
      const userCity = userCities.find(
        (c) => c.name === city.name
      );
      const tier = cityTiers.get(city.name) ?? 2;

      return {
        ...city,

        // 🔥 Hybrid model
        traffic:
          userCity?.traffic ??
          simulateTraffic(
            tier === 1 ? "high" : "medium", // intensity by tier
            30,                                  // default weather score
            city.name
          ),
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });

  } catch (error) {
    console.error("City traffic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch city traffic",
    });
  }
};