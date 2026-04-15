import express from "express";
import { analyzeShipment } from "../controllers/analyze.controller.js";

const router = express.Router();

// Full pipeline API
router.post("/", analyzeShipment);

export default router;