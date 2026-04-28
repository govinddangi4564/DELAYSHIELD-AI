import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const mongoUri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DB_NAME || 'delayshield_ai'

if (!mongoUri) {
  console.warn('[db] MONGODB_URI is not configured. MongoDB features will fail until it is set.')
}

export async function initDatabase() {
  if (!mongoUri) {
    return null
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  await mongoose.connect(mongoUri, {
    dbName: databaseName
  })

  return mongoose.connection
}

export async function getDatabase() {
  return initDatabase()
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
