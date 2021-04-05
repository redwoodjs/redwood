/**
 *
 * Based on Stripe's secure webhook implementation
 * @see https://stripe.com/docs/webhooks/signatures
 *
 * And GitHub's webhook payload validation
 * @see https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks
 */

import { createHmac, timingSafeEqual } from 'crypto'

import type { APIGatewayProxyEvent } from 'aws-lambda'

// TODO
export enum WebhookVerificationMethod {
  'sha256',
  'ts',
}

/**
 * @const {string}
 */
const ERROR_MESSAGE = "You don't have access to invoke this function."

/**
 * @const {number}
 */
const FIVE_MINUTES = 5 * 60 * 1000

/**
 * @const {number}
 */
const DEFAULT_TOLERANCE = FIVE_MINUTES

/**
 * @const {string}
 */
const WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'] ?? ''

/**
 * @const {string}
 */
export const WEBHOOK_SIGNATURE_HEADER = 'RW-WEBHOOK-SIGNATURE'

/**
 * VerifyOptions
 * Used when verifying a signature's time component for permitted leeway.
 *
 * @typedef {Object} VerifyOptions
 * @property {number} tolerance - Optional tolerance in msec
 * @property {number} timestamp - Optional timestamp in msec
 */
export interface VerifyOptions {
  tolerance?: number
  timestamp?: number
}

/**
 * Class representing a WebhookError
 * @extends Error
 */
class WebhookError extends Error {
  /**
   * Create a WebhookError.
   * @param {string} message - The error message
   * */
  constructor(message: string) {
    super(message)
  }
}

/**
 * Class representing a WebhookVerificationError
 * @extends WebhookError
 */
export class WebhookVerificationError extends WebhookError {
  /**
   * Create a WebhookVerificationError.
   * @param {string} message - The error message
   * */
  constructor(message: string) {
    super(message)
  }
}

/**
 * Generates a hash-based message authentication code from a secret.
 *
 * @param {string} secret - Secret key used to sign
 * @return {string} - A HMAC
 *
 * @example
 *
 *    getHmac({ secret: 'MY_SECRET' })
 */
const getHmac = ({ secret }: { secret: string }) => {
  if (typeof secret === 'undefined' || secret === '') {
    throw new WebhookVerificationError(ERROR_MESSAGE)
  }

  return createHmac('sha256', secret)
}

/**
 * Extracts signature from Lambda Event.
 *
 * @param {APIGatewayProxyEvent} event - The event that incudes the request details, like headers
 * @return {string} - The header found in WEBHOOK_SIGNATURE_HEADER
 *
 * @example
 *
 *    signatureFromEvent({ event: event })
 */
export const signatureFromEvent = ({
  event,
}: {
  event: APIGatewayProxyEvent
}): string => {
  const header = WEBHOOK_SIGNATURE_HEADER.toLocaleLowerCase()
  return event.headers[header] as string
}

/*
 * The Redwood-Webhook-Signature header included in each signed event contains a timestamp and one or more signatures.
 * The timestamp is prefixed by t=, and each signature is prefixed by a scheme. Schemes start with v, followed by an integer.
 * Currently, the only valid live signature scheme is v1.
 *
 * The signed_payload string is created by concatenating:
 *
 * The timestamp (as a string)
 * The character .
 * The actual JSON payload (i.e., the request body)
 *
 * @param {string} body - The body payload to sign.
 * @param {string} secret - The secret key used to sign. Defaults to WEBHOOK_SECRET.
 * @param {number} timestamp - Timestamp in msec used to sign. Defaults to now.
 * @return {string} - The signature
 *
 * @example
 *
 *    sign({ body: 'This is some content to sign.' })
 */
export const sign = ({
  body,
  secret = WEBHOOK_SECRET,
  timestamp = Date.now(),
}: {
  body: string
  secret: string
  timestamp?: number
}): string => {
  const hmac = getHmac({ secret })
  hmac.update(timestamp + '.' + body)

  return `t=${timestamp},v1=${hmac.digest('hex')}`
}

/**
 * Verifies event is signed with a valid webhook signature.
 * See verifySignature() for implementation rules.
 *
 * @param {APIGatewayProxyEvent} event - The event that incudes the request details, like headers.
 * @param {VerifyOptions} options - Options for verifying the timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verify({ event: event, options: {} })*
 */
export const verify = ({
  event,
  options,
}: {
  event: APIGatewayProxyEvent
  options?: VerifyOptions
}): boolean | WebhookVerificationError => {
  const body = event.body || ''
  const signature = signatureFromEvent({ event })

  return verifySignature({
    body,
    secret: WEBHOOK_SECRET,
    signature,
    options,
  })
}

/**
 * Logic to verify the body payload with a given signature.
 *
 * The value for the prefix t corresponds to the timestamp, and v1 corresponds to the signature (or signatures).
 *
 * Compare the signature (or signatures) in the header to the expected signature.
 * For an equality match, we compute the tolerance between the current timestamp and the received timestamp,
 * then decide if the tolerance is within your tolerance -- in our case this is 5 minutes.
 *
 * Because this timestamp is part of the signed payload, it is also verified by the signature,
 * so an attacker cannot change the timestamp without invalidating the signature.
 * If the signature is valid but the timestamp is too old, we reject the payload.
 *
 * This tolerance protects against timing attacks by comparing the expected signature to each of the received signatures.
 *
 * @param {string} body - The body payload.
 * @param {string} secret - The secret key used to sign. Defaults to WEBHOOK_SECRET.
 * @param {string} signature - The signature.
 * @param {VerifyOptions} options - Options for verifying the timestamp leeway.
 * @return {boolean \ WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifySignature({ body: event,
 *                      signature: 't=1535555109,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd`',
 *                      options: {} })
 */

export const verifySignature = ({
  body,
  secret = WEBHOOK_SECRET,
  signature,
  options = {},
}: {
  body: string
  secret: string
  signature: string
  options?: VerifyOptions
}): boolean | WebhookVerificationError => {
  const match = /t=(\d+),v1=([\da-f]+)/.exec(signature)
  if (!match) {
    throw new WebhookVerificationError(ERROR_MESSAGE)
  }

  const signedStamp = Number(match[1])
  const payload = match[2]

  const timestamp = options?.timestamp ?? Date.now()
  const tolerance = options?.tolerance ?? DEFAULT_TOLERANCE

  const difference = Math.abs(timestamp - signedStamp)

  if (difference > tolerance) {
    throw new WebhookVerificationError(ERROR_MESSAGE)
  }

  const hmac = getHmac({ secret })
  hmac.update(signedStamp + '.' + body)

  if (hmac.digest('hex') === payload) {
    return true
  }

  throw new WebhookVerificationError(ERROR_MESSAGE)
}

interface webhookVerificationOptions {
  signature: string
  secret: string
  payload: string
}

export const verifyWebhookSignature = ({
  signature,
  secret,
  payload,
}: webhookVerificationOptions): boolean => {
  try {
    const algorithm = signature.split('=')[0]
    const webhookSignature = Buffer.from(signature || '', 'utf8')
    const hmac = createHmac(algorithm, secret)
    const digest = Buffer.from(
      algorithm + '=' + hmac.update(payload).digest('hex'),
      'utf8'
    )

    const verified =
      webhookSignature.length !== digest.length ||
      !timingSafeEqual(digest, webhookSignature)

    return verified
  } catch (error) {
    throw new Error(`Unable to verify webhook signature: ${error.message}`)
  }
}
