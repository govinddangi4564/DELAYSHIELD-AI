import express from 'express';
import riskRoutes from "./risk.route.js"
import decisionRoutes from "./decision.route.js"
import analyzeRoutes from "./analyze.routes.js";
const router = express.Router();

router.get('/', (req, res) => {
  res.send('API working 🚀');
});

router.use("/risk", riskRoutes);
router.use("/decision", decisionRoutes);
router.use("/analyze", analyzeRoutes);


export default router;