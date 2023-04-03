import jwt from 'jsonwebtoken'

const getExpiryTime = () => {
  return Date.now() + 3600 * 1000
}

export const getNetlifyAuthHeader = (
  userId?: string,
  email?: string,
  secret?: string
) => {
  const payload = {
    exp: getExpiryTime(),
    sub: userId ?? 'test-user-id',
    email: email ?? 'user@example.com',
    app_metadata: {
      provider: 'email',
    },
    user_metadata: {},
    roles: [],
  }

  // in dev, Netlify simply decodes as there is no access to the actual secret used to sign the JWT
  if (!secret) {
    throw new Error('No secret provided for Netlify auth provider')
  }
  const token = jwt.sign(payload, secret)

  return {
    authProvider: 'netlify',
    authorization: `Bearer ${token}`,
  }
}
