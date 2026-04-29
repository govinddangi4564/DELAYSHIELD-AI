import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'

dotenv.config()

const app = express()
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({
  origin: allowedOrigin
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
