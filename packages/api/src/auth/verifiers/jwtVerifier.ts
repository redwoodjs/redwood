import jwt from 'jsonwebtoken'

import {
  VerifyOptions,
  WebhookSignError,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
import type { WebhookVerifier } from './index'

export type JwtVerifier = WebhookVerifier

/**
 *
 * createSignature
 *
 */
const createSignature = ({
  payload,
  secret = DEFAULT_WEBHOOK_SECRET,
  options,
}: {
  payload: string | Record<string, unknown>
  secret: string
  options: VerifyOptions
}): string => {
  try {
    const signOptions = options.issuer ? { issuer: options.issuer } : undefined

    return jwt.sign(payload, secret, { ...signOptions })
  } catch (error) {
    throw new WebhookSignError(error.message)
  }
}

/**
 *
 * verifySignature
 *
 */
export const verifySignature = ({
  payload,
  secret = DEFAULT_WEBHOOK_SECRET,
  signature,
  options,
}: {
  payload: string | Record<string, unknown>
  secret: string
  signature: string
  options: VerifyOptions
}): boolean => {
  try {
    if (payload === undefined || payload?.length === 0) {
      console.warn('Missing payload')
    }

    const decoded = jwt.verify(signature, secret) as Record<string, unknown>

    if (decoded['iss'] && decoded['iss'] !== options.issuer) {
      throw new WebhookVerificationError()
    }

    return true

    throw new WebhookVerificationError()
  } catch (error) {
    throw new WebhookVerificationError()
  }
}

/**
 *
 * JWT
 *
 */
export const jwtVerifier = (options: VerifyOptions): JwtVerifier => {
  return {
    sign: ({ payload, secret }) => {
      return createSignature({ payload, secret, options })
    },
    verify: ({ payload, secret, signature }) => {
      return verifySignature({ payload, secret, signature, options })
    },
    type: 'jwtVerifier',
  }
}
