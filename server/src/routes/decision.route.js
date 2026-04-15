/**
 * decision.routes.js
 * Defines all routes for the decision engine feature.
 * Mounted at /api/decision via routes/index.js
 */

import { Router } from "express";
import { analyzeDecision } from "../controllers/decision.controller.js";

const router = Router();

/**
 * POST /api/decision/analyze
 * Accepts traffic, weather, delay, priority
 * Returns risk + decision output
 */
router.post("/analyze", analyzeDecision);

export default router;