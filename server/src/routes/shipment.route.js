import { Router } from "express";
import {
  getShipments,
  getShipmentById,
} from "../controllers/shipment.controller.js";

const router = Router();

// Get all shipments
router.get("/", getShipments);

// Get one shipment
router.get("/:id", getShipmentById);

export default router;