import { Router } from 'express'
import shipmentRoutes from './shipment.route.js'
import analyzeRoutes from './analyze.routes.js'
import cityRoutes from './city.routes.js'
import simulationRoutes from './simulation.route.js'
import historyRoutes from './history.route.js'
import riskRoutes from './risk.route.js'
import decisionRoutes from './decision.route.js'
import authRoutes from './auth.route.js'
import communicationRoutes from './communication.routes.js'
import slaGuardianRoutes from './slaGuardian.route.js'
import { generateDynamicShipment } from '../controllers/analyze.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() })
})

router.use('/auth', authRoutes)
router.use('/shipment', shipmentRoutes)
router.use('/analyze', analyzeRoutes)
router.use('/city', cityRoutes)
router.use('/simulation', simulationRoutes)
router.use('/history', historyRoutes)
router.use('/risk', riskRoutes)
router.use('/decision', decisionRoutes)
router.use('/communication', communicationRoutes)
router.use('/sla', slaGuardianRoutes)

router.post('/analyze-shipment', requireAuth, generateDynamicShipment)

export default router
