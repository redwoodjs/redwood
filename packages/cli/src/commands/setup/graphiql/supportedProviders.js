import CryptoJS from 'crypto-js'
import { v4 as uuidv4 } from 'uuid'

// tests if id, which is always a string from cli, is actually a number or uuid
const isNumeric = (id) => {
  return /^\d+$/.test(parseInt(id))
}

const getExpiryTime = (expiry) => {
  return expiry ? Date.now() + expiry * 60 * 1000 : Date.now() + 3600 * 1000
}

const getDBAuthHeader = (userId) => {
  if (!userId) {
    throw new Error('Require an unique id to generate session cookie')
  }

  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
  }
  const id = isNumeric(userId) ? parseInt(userId) : userId
  const cookie = CryptoJS.AES.encrypt(
    JSON.stringify({ id }) + ';' + uuidv4(),
    process.env.SESSION_SECRET
  ).toString()

  return {
    'auth-provider': 'dbAuth',
    cookie: `session=${cookie}`,
    authorization: `Bearer ${id}`,
  }
}

const getSupabasePayload = (id, expiry) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }

  const payload = {
    aud: 'authenticated',
    exp: getExpiryTime(expiry),
    sub: id ?? 'test-user-id',
    email: 'user@example.com',
    app_metadata: {
      provider: 'email',
    },
    user_metadata: {},
    role: 'authenticated',
    roles: [],
  }

  return payload
}

const getNetlifyPayload = (id, expiry) => {
  const payload = {
    exp: getExpiryTime(expiry),
    sub: id ?? 'test-user-id',
    email: 'user@example.com',
    app_metadata: {
      provider: 'email',
      authorization: {
        roles: [],
      },
    },
    user_metadata: {},
  }

  return payload
}

export const supportedProviders = {
  dbAuth: { getPayload: getDBAuthHeader, env: '' },
  supabase: {
    getPayload: getSupabasePayload,
    env: 'process.env.SUPABASE_JWT_SECRET',
  },
  // no access to netlify JWT private key in dev.
  netlify: { getPayload: getNetlifyPayload, env: '"secret-123"' },
}
