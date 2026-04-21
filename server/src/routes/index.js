import express from 'express';
import riskRoutes from "./risk.route.js"
import decisionRoutes from "./decision.route.js"
import analyzeRoutes from "./analyze.routes.js";
import simulationRoutes from "./simulation.route.js";
import shipmentRoutes from "./shipment.route.js";
import cityRoutes from "./city.routes.js";

const router = express.Router();

router.get('/', (req, res) => {
  res.send('API working 🚀');
});

router.use("/risk", riskRoutes);
router.use("/decision", decisionRoutes);
router.use("/analyze", analyzeRoutes);
router.use("/simulation", simulationRoutes);
router.use("/shipment", shipmentRoutes);
router.use("/city", cityRoutes);

export default router;