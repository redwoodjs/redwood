import jwt from 'jsonwebtoken'

import {
  VerifyOptions,
  WebhookSignError,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
import type { WebhookVerifier } from './index'

export interface JwtVerifier extends WebhookVerifier {}

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
  options: VerifyOptions | undefined
}): string => {
  try {
    const signOptions = options?.issuer
      ? { issuer: options?.issuer }
      : undefined

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
  options: VerifyOptions | undefined
}): boolean => {
  try {
    if (payload === undefined || payload?.length === 0) {
      console.warn('Missing payload')
    }

    if (options?.issuer) {
      jwt.verify(signature, secret, { issuer: options?.issuer }) as Record<
        string,
        unknown
      >
    } else {
      jwt.verify(signature, secret) as Record<string, unknown>
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
export const jwtVerifier = (
  options?: VerifyOptions | undefined
): JwtVerifier => {
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
