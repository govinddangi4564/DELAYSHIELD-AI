import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { findUserById } from '../repositories/user.repository.js'

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET

function getTokenFromRequest(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice(7)
}

export async function requireAuth(req, res, next) {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured'
      })
    }

    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const payload = jwt.verify(token, JWT_SECRET)
    const user = await findUserById(payload.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      googleId: user.google_id
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}
