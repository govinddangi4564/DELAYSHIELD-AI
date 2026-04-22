import { Router } from "express";
import {
  runSingleSimulation,
  runMultipleSimulations,
} from "../controllers/simulation.controller.js";

const router = Router();

// ----------------------------
// HEALTH CHECK
// ----------------------------
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Simulation API is running",
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------
// MULTI-SCENARIO SIMULATION (Main Endpoint)
// ----------------------------
router.post("/", (req, res, next) => {
  console.log("📊 /api/simulation called (Multi-Scenario)");
  runMultipleSimulations(req, res, next);
});

// ----------------------------
// SINGLE SCENARIO SIMULATION
// ----------------------------
router.post("/run", (req, res, next) => {
  console.log("📊 /api/simulation/run called (Single)");
  runSingleSimulation(req, res, next);
});

// Legacy support (optional, can be removed)
router.post("/run-multiple", (req, res, next) => {
  runMultipleSimulations(req, res, next);
});

export default router;