import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'
import { initDatabase } from './db/pool.js'
import { seedDefaultTemplates } from './engine/communication/communicationEngine.js'

dotenv.config()

const app = express()

let dbInitialized = false
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase()
      await seedDefaultTemplates()
      dbInitialized = true
    } catch (err) {
      console.error('[db] Late database initialization failed in serverless function:', err.message)
    }
  }
  next()
})

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://delayshield-ai.vercel.app',
    process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : null
  ].filter(Boolean),
  credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.redirect(process.env.CLIENT_URL || 'https://delayshield-ai.vercel.app/')
})

app.use('/api', routes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.message)

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  })
})

export default app
