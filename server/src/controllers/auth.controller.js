import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import {
  attachLocalPassword,
  createLocalUser,
  findUserByEmail,
  upsertGoogleUser
} from '../repositories/user.repository.js'

dotenv.config()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const JWT_SECRET = process.env.JWT_SECRET
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

function getAllowedAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function signSessionToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '4h' }
  )
}

function formatAuthResponse(user) {
  const token = signSessionToken(user)
  const role = isAuthorizedAdminEmail(user.email) ? 'admin' : 'user'

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role
    }
  }
}

function isAuthorizedAdminEmail(email) {
  const adminEmails = getAllowedAdminEmails()
  return adminEmails.length === 0 || adminEmails.includes(String(email).toLowerCase())
}

export async function googleAuth(req, res) {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      })
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID is not configured'
      })
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured'
      })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const googleId = payload?.sub
    const email = String(payload?.email || '').toLowerCase()
    const name = payload?.name
    const emailVerified = payload?.email_verified

    if (!googleId || !email || !name || !emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google identity payload'
      })
    }



    const user = await upsertGoogleUser({ googleId, email, name })
    return res.status(200).json(formatAuthResponse(user))
  } catch (error) {
    console.error('[auth] Google login failed:', error.message)
    return res.status(401).json({
      success: false,
      message: 'Failed to verify Google sign-in'
    })
  }
}

export async function signupWithPassword(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const name = String(req.body?.name || '').trim()
    const password = String(req.body?.password || '')

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      })
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured'
      })
    }



    const existing = await findUserByEmail(email)
    const passwordHash = await bcrypt.hash(password, 12)

    const user = existing
      ? await attachLocalPassword(existing.id, { name, passwordHash })
      : await createLocalUser({ email, name, passwordHash })

    return res.status(existing ? 200 : 201).json(formatAuthResponse(user))
  } catch (error) {
    console.error('[auth] Manual signup failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to create account'
    })
  }
}

export async function loginWithPassword(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured'
      })
    }

    const user = await findUserByEmail(email)

    if (!user?.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }



    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    return res.status(200).json(formatAuthResponse(user))
  } catch (error) {
    console.error('[auth] Manual login failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to sign in'
    })
  }
}

export async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user
  })
}
