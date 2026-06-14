import app from './app.js'
import dotenv from 'dotenv'
import { initDatabase } from './db/pool.js'
import { seedDefaultTemplates } from './engine/communication/communicationEngine.js'

dotenv.config()

const PORT = process.env.PORT || 5000

initDatabase()
  .then(() => {
    seedDefaultTemplates()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`DelayShield Server Active on Port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('[server] Database initialization failed:', error.message)
    process.exit(1)
  })
