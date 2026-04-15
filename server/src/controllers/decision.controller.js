import { calculateRisk } from "../engine/risk/riskengine.js";
import { makeDecision } from "../engine/decision/decisionengine.js";

// ------------------------------
// VALIDATION
// ------------------------------
const isValidNumber = (val) =>
  val === undefined || (typeof val === "number" && val >= 0 && val <= 100);

// ------------------------------
// CONTROLLER
// ------------------------------
export const analyzeDecision = (req, res) => {
  try {
    const { traffic, weather, delay, priority = "Medium" } = req.body;

    // Validate input presence
    if (
      traffic === undefined &&
      weather === undefined &&
      delay === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of: traffic, weather, delay",
      });
    }

    // Validate ranges
    if (
      !isValidNumber(traffic) ||
      !isValidNumber(weather) ||
      !isValidNumber(delay)
    ) {
      return res.status(400).json({
        success: false,
        message: "Inputs must be numbers between 0 and 100",
      });
    }

    console.log("Decision request:", { traffic, weather, delay, priority });

    // ------------------------------
    // STEP 1: RISK
    // ------------------------------
    const riskResult = calculateRisk({ traffic, weather, delay });

    // ------------------------------
    // STEP 2: DECISION
    // ------------------------------
    const decision = makeDecision(riskResult);

    // ------------------------------
    // RESPONSE
    // ------------------------------
    return res.status(200).json({
      success: true,
      data: {
        input: { traffic, weather, delay, priority },
        risk: riskResult,
        decision: decision,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Decision error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};