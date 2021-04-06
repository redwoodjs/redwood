import { createHmac, timingSafeEqual } from 'crypto'

import {
  WebhookVerificationError,
  VERIFICATION_ERROR_MESSAGE,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
import type { WebhookVerifier } from './index'

export type Sha256 = WebhookVerifier

/**
 *
 * createSignature
 *
 */
const createSignature = ({
  body,
  secret = DEFAULT_WEBHOOK_SECRET,
}: {
  body: string
  secret: string
  timestamp?: number
}): string => {
  return body + secret
}

/**
 *
 * verifySignature
 *
 */
export const verifySignature = ({
  body,
  secret = DEFAULT_WEBHOOK_SECRET,
  signature,
}: {
  body: string
  secret: string
  signature: string
}): boolean => {
  try {
    // check if sha256? or make this a general sha verifier?
    const algorithm = signature.split('=')[0]
    const webhookSignature = Buffer.from(signature || '', 'utf8')
    const hmac = createHmac(algorithm, secret)
    const digest = Buffer.from(
      algorithm + '=' + hmac.update(body).digest('hex'),
      'utf8'
    )

    const verified =
      webhookSignature.length !== digest.length ||
      !timingSafeEqual(digest, webhookSignature)

    return verified
  } catch (error) {
    throw new WebhookVerificationError(
      `${VERIFICATION_ERROR_MESSAGE}: ${error.message}`
    )
  }
}

/**
 *
 * Based on GitHub's webhook payload validation
 * @see https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks
 *
 */
export const sha256 = (): WebhookVerifier => {
  return {
    sign: ({ body, secret }) => {
      return createSignature({ body, secret })
    },
    verify: ({ body, secret, signature }) => {
      return verifySignature({ body, secret, signature })
    },
    type: 'sha256',
  }
}
