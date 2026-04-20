/**
 * simulationController.js
 * Enhanced HTTP layer for What-If Simulation Engine
 */

import {
  runSimulation,
  runMultipleScenarios,
} from "../engine/simulation/whatifengine.js";

// ----------------------------
// VALIDATION HELPERS
// ----------------------------

const isValidNumber = (val) =>
  val === undefined || (typeof val === "number" && val >= 0);

const validateInputFields = (input) => {
  const { traffic, weather, delay } = input;

  if (
    !isValidNumber(traffic) ||
    !isValidNumber(weather) ||
    !isValidNumber(delay)
  ) {
    return false;
  }
  return true;
};

// ----------------------------
// SINGLE SIMULATION
// ----------------------------

export const runSingleSimulation = (req, res) => {
  try {
    const { baseInput, changes } = req.body;

    // 🔴 Basic validation
    if (!baseInput || typeof baseInput !== "object") {
      return res.status(400).json({
        success: false,
        message: "'baseInput' must be a valid object",
      });
    }

    if (!changes || typeof changes !== "object") {
      return res.status(400).json({
        success: false,
        message: "'changes' must be a valid object",
      });
    }

    // 🔴 Field validation
    if (!validateInputFields(baseInput) || !validateInputFields(changes)) {
      return res.status(400).json({
        success: false,
        message: "traffic, weather, delay must be valid numbers >= 0",
      });
    }

    console.log("📊 Running single simulation:", { baseInput, changes });

    const result = runSimulation(baseInput, changes);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });

  } catch (error) {
    console.error("❌ Simulation Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Simulation failed",
    });
  }
};

// ----------------------------
// MULTIPLE SIMULATIONS
// ----------------------------

export const runMultipleSimulations = (req, res) => {
  try {
    const { baseInput, scenarioList } = req.body;

    // 🔴 Basic validation
    if (!baseInput || typeof baseInput !== "object") {
      return res.status(400).json({
        success: false,
        message: "'baseInput' must be a valid object",
      });
    }

    if (!Array.isArray(scenarioList) || scenarioList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "'scenarioList' must be a non-empty array",
      });
    }

    // 🔴 Validate base input
    if (!validateInputFields(baseInput)) {
      return res.status(400).json({
        success: false,
        message: "Invalid baseInput values",
      });
    }

    console.log("📊 Running multiple simulations:", {
      scenarios: scenarioList.length,
    });

    const results = runMultipleScenarios(baseInput, scenarioList);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error("❌ Multiple Simulation Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Simulation failed",
    });
  }
};