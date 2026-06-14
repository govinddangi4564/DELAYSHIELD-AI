import { Router } from 'express';
import { getHighRiskShipments, getShipmentSLA, analyzeCustomSLA } from '../controllers/slaGuardian.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// To test easily without auth, we won't strictly enforce requireAuth here,
// or we can add it if needed. For now let's leave it open for easy testing.
router.get('/high-risk', getHighRiskShipments);
router.get('/shipment/:shipmentId', getShipmentSLA);
router.post('/analyze', analyzeCustomSLA);

export default router;
