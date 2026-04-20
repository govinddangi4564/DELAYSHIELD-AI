import { Router } from "express";
import { getCityTraffic } from "../controllers/city.controller.js";

const router = Router();

// GET → simple usage
router.get("/traffic", getCityTraffic);

// POST → allows user override
router.post("/traffic", getCityTraffic);

export default router;