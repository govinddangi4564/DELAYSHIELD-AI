import { calculateRisk } from "../engine/risk/riskengine.js";
import { makeDecision } from "../engine/decision/decisionengine.js";
import { getWeatherData } from "../integrations/weather.api.js";
import { getRoute } from "../integrations/route.api.js";
import { calculateCostImpact } from "../engine/cost/costengine.js";
import { generateAIPlan } from "../engine/decision/aiplanner.js";
import { explainDecision } from "../engine/decision/aiExplainer.js";
import { generateAlert } from "../engine/alerts/alertEngine.js";
import { addHistory } from "../engine/history/historyEngine.js";
import { simulateTraffic } from "../utils/simulatetraffic.js";

export const analyzeShipment = async (req, res) => {
  try {
    
    const { traffic, delay, lat, lon, endLat, endLon, priority, shipmentId, origin, destination } = req.body;
    const safeShipmentId = String(shipmentId || "SHP-0");

    // CRITICAL: Ensure numbers for stability
    const nLat = Number(lat);
    const nLon = Number(lon);
    const nEndLat = Number(endLat);
    const nEndLon = Number(endLon);

    // 1. Environmental Data Retrieval
    let weatherData = { weatherScore: 25 };
    let routeData = { distance: 210000, duration: 14400, majorRoads: ["Main Highway"], suggestedAltRoads: ["NH-Alt-A", "NH-Alt-B"], path: [[nLat, nLon], [nEndLat, nEndLon]] };

    try {
      const [w, r] = await Promise.all([
        getWeatherData(nLat, nLon).catch(() => weatherData),
        getRoute([nLon, nLat], [nEndLon, nEndLat]).catch(() => routeData)
      ]);
      weatherData = w;
      routeData = r;
    } catch (e) {}

    const finalTraffic = traffic ?? simulateTraffic("medium", weatherData.weatherScore, "Bhopal");

    // 2. Core Operational Engines
    const riskResult = calculateRisk({ traffic: finalTraffic, weather: weatherData.weatherScore || 25, delay: delay || 0 });
    const decisionResult = makeDecision(riskResult);
    const costResult = calculateCostImpact({ delay: delay || 0, priority: priority || "Medium", riskLevel: riskResult.level, routeData });

    // 3. AI Strategic Guidance (Non-blocking, but unified)
    const aiResult = await generateAIPlan({
      risk: { ...riskResult, traffic: finalTraffic, delay },
      decision: decisionResult,
      route: routeData,
      cost: costResult,
      shipmentId: safeShipmentId,
      origin: origin?.name || origin || "Origin",
      destination: destination?.name || destination || "Destination"
    });
    console.log("Reached here");
    console.log("AI Result:", aiResult);

    // 4. Alerts & Explainer Narrative
    const alertResult = generateAlert({ risk: riskResult, decision: decisionResult, aiInsights: aiResult.data });
    const explainerResult = explainDecision({ risk: riskResult, decision: decisionResult, cost: costResult, shipmentId: safeShipmentId });

    // 5. Unified Response Synthesis
    // We merge AI data and Explainer data to ensure the UI ALWAYS has something to show.
    const unifiedInsights = {
      ...explainerResult,
      ...aiResult.data,
      success: aiResult.success
    };

    const aiHighways = aiResult.data?.identifiedHighways || [];
    
    // Silent history save (Nodemon safe)
    try {
      addHistory({ 
        shipmentId: safeShipmentId, 
        route: aiHighways[0] || routeData.majorRoads[0], 
        decision: decisionResult.action, 
        riskScore: riskResult.score, 
        costImpact: costResult.totalImpact || 0 
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      input: { traffic: finalTraffic, delay, shipmentId: safeShipmentId },
      risk: riskResult,
      decision: decisionResult,
      cost: costResult,
      weather: weatherData,
      route: {
        ...routeData,
        majorRoads: aiHighways.length > 0 ? [aiHighways[0]] : routeData.majorRoads,
        suggestedAltRoads: aiHighways.length > 2 ? [aiHighways[1], aiHighways[2]] : (routeData.suggestedAltRoads || ["NH-Alt-A", "NH-Alt-B"])
      },
      ai: unifiedInsights, // Replaced split ai/explanation with a unified object
      alert: alertResult,
    });

  } catch (error) {
    console.error("[analyzeController] Critical Failure:", error.message);
    return res.status(500).json({ success: false, message: "System failure in analysis pipeline" });
  }
};