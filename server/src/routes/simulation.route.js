/**
 * simulation.route.js
 * Route definitions for What-If Simulation Engine
 */

import { Router } from "express";
import {
  runSingleSimulation,
  runMultipleSimulations,
} from "../controllers/simulation.controller.js";

const router = Router();

// ----------------------------
// HEALTH CHECK (🔥 DEMO BOOST)
// ----------------------------
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Simulation API is running",
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------
// SINGLE SIMULATION
// ----------------------------
router.post("/run", (req, res, next) => {
  console.log("📊 /simulation/run called");
  runSingleSimulation(req, res, next);
});

// ----------------------------
// MULTIPLE SIMULATION
// ----------------------------
router.post("/run-multiple", (req, res, next) => {
  console.log("📊 /simulation/run-multiple called");
  runMultipleSimulations(req, res, next);
});

export default router;