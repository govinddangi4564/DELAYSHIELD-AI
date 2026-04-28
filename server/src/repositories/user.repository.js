import { User } from '../models/user.model.js'

function mapUser(document) {
  if (!document) return null

  return {
    id: document._id.toString(),
    google_id: document.googleId,
    name: document.name,
    email: document.email,
    password_hash: document.passwordHash ?? null,
    auth_providers: Array.isArray(document.authProviders) ? document.authProviders : [],
    created_at: document.createdAt
  }
}

export async function findUserByGoogleId(googleId) {
  const user = await User.findOne({ googleId }).lean()
  return mapUser(user)
}

export async function findUserByEmail(email) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).lean()
  return mapUser(user)
}

export async function findUserById(id) {
  const user = await User.findById(id).lean()
  return mapUser(user)
}

export async function upsertGoogleUser({ googleId, email, name }) {
  const user = await User.findOneAndUpdate(
    {
      $or: [{ googleId }, { email }]
    },
    {
      $set: {
        googleId,
        email,
        name
      },
      $addToSet: {
        authProviders: 'google'
      },
      $setOnInsert: {
        createdAt: new Date().toISOString()
      }
    },
    {
      upsert: true,
      new: true
    }
  ).lean()

  return mapUser(user)
}

export async function createLocalUser({ email, name, passwordHash }) {
  const normalizedEmail = String(email).toLowerCase()
  const created = await User.create({
    googleId: `local:${normalizedEmail}`,
    email: normalizedEmail,
    name,
    passwordHash,
    authProviders: ['local'],
    createdAt: new Date().toISOString()
  })

  return mapUser(created.toObject())
}

export async function attachLocalPassword(userId, { name, passwordHash }) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name,
        passwordHash
      },
      $addToSet: {
        authProviders: 'local'
      }
    },
    { new: true }
  ).lean()

  return mapUser(user)
}
