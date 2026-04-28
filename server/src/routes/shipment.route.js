import { Router } from 'express'
import {
  createShipment,
  getShipmentById,
  getShipments,
  getPublicShipment
} from '../controllers/shipment.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, getShipments)
router.post('/', requireAuth, createShipment)
router.get('/shared/:id', getPublicShipment)
router.get('/:id', requireAuth, getShipmentById)

export default router
