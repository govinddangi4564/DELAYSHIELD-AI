import { Router } from "express";
import shipmentRoutes from "./shipment.route.js";
import analyzeRoutes from "./analyze.routes.js";
import cityRoutes from "./city.routes.js";
import simulationRoutes from "./simulation.route.js";
import historyRoutes from "./history.route.js";
import riskRoutes from "./risk.route.js";
import decisionRoutes from "./decision.route.js";

const router = Router();

// Standard health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// ─── Module Routes ───────────────────────────────────────────
router.use("/shipment", shipmentRoutes);
router.use("/analyze", analyzeRoutes);
router.use("/city", cityRoutes);
router.use("/simulation", simulationRoutes); // mapped to /api/simulation
router.use("/history", historyRoutes);
router.use("/risk", riskRoutes);
router.use("/decision", decisionRoutes);

export default router;