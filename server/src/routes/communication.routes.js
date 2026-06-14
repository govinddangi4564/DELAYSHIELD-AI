import express from 'express'
import { getLogs, getTemplates, updateTemplate, triggerManualNotification } from '../controllers/communication.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/logs', requireAuth, getLogs)
router.get('/templates', requireAuth, getTemplates)
router.put('/templates/:id', requireAuth, updateTemplate)
router.post('/trigger', requireAuth, triggerManualNotification)

export default router
