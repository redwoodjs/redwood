import jwt from 'jsonwebtoken'

export const nhost = async (token: string) => {
  const CLAIMS_NAMESPACE =
    process.env.NHOST_CLAIMS_NAMESPACE || 'https://hasura.io/jwt/claims'
  const SUB_CLAIM = process.env.NHOST_SUB_CLAIM || 'x-hasura-user-id'
  const ROLES_CLAIM = process.env.NHOST_ROLES_CLAIM || 'x-hasura-allowed-roles'

  if (!process.env.NHOST_JWT_SECRET) {
    console.error('NHOST_JWT_SECRET env var is not set.')
    throw new Error('NHOST_JWT_SECRET env var is not set.')
  }

  try {
    const secret = process.env.NHOST_JWT_SECRET as string
    const decoded = (await jwt.verify(token, secret)) as Record<string, unknown>

    const claims = decoded[CLAIMS_NAMESPACE] as Record<string, unknown>
    const sub = claims[SUB_CLAIM]
    const roles = claims[ROLES_CLAIM]

    return { ...decoded, sub, iss: 'nhost', roles }
  } catch (error) {
    throw new Error(error)
  }
}
