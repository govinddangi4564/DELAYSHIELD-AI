import { Router } from "express";
import { getAllHistory, getShipmentHistory, createHistoryEntry } from "../controllers/history.controller.js";

const router = Router();

// GET /api/history
router.get("/", getAllHistory);

// POST /api/history
router.post("/", createHistoryEntry);

// GET /api/history/:shipmentId
router.get("/:shipmentId", getShipmentHistory);

export default router;
