import jwt from 'jsonwebtoken'

import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'nhost') {
    return null
  }

  const CLAIMS_NAMESPACE =
    process.env.NHOST_CLAIMS_NAMESPACE || 'https://hasura.io/jwt/claims'
  const ROLES_CLAIM = process.env.NHOST_ROLES_CLAIM || 'x-hasura-allowed-roles'

  if (!process.env.NHOST_JWT_SECRET) {
    console.error('NHOST_JWT_SECRET env var is not set.')
    throw new Error('NHOST_JWT_SECRET env var is not set.')
  }

  try {
    const secret = process.env.NHOST_JWT_SECRET as string
    const decoded = (await jwt.verify(token, secret)) as Record<string, unknown>

    const claims = decoded[CLAIMS_NAMESPACE] as Record<string, unknown>
    const roles = claims?.[ROLES_CLAIM]

    return { ...decoded, roles }
  } catch (error: any) {
    throw new Error(error)
  }
}
