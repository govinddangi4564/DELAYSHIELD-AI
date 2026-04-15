import express from "express";
import { analyzeRisk } from "../controllers/risk.controller.js";

const router = express.Router();



router.post("/analyze", analyzeRisk);//AnalyzeRisk

export default router;