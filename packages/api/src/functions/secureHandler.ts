import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  createVerifier,
  VerifyOptions,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from 'src/auth/verifiers'

/**
 * @const {string}
 */
export const DEFAULT_WEBHOOK_SIGNATURE_HEADER = 'RW-WEBHOOK-SIGNATURE'

/**
 * Extracts signature from Lambda Event.
 *
 * @param {APIGatewayProxyEvent} event - The event that incudes the request details, like headers
 * @param {string} signatureHeader - The name of header key that contains the signature; defaults to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @return {string} - The signature found in the headers specified by signatureHeader
 *
 * @example
 *
 *    signatureFromEvent({ event: event })
 */
export const signatureFromEvent = ({
  event,
  signatureHeader = DEFAULT_WEBHOOK_SIGNATURE_HEADER,
}: {
  event: APIGatewayProxyEvent
  signatureHeader: string
}): string => {
  const header = signatureHeader.toLocaleLowerCase()
  return event.headers[header] as string
}

/**
 * Verifies event is signed with a valid webhook signature.
 * See verifySignature() for implementation rules.
 *
 * @param {APIGatewayProxyEvent} event - The event that incudes the request details, like headers.
 * @param {string} signatureHeader - The name of header key that contains the signature; defaults to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @param {VerifyOptions} options - Options for verifying the timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verify({ event: event, options: {} })*
 */
export const verify = ({
  event,
  payload,
  secret = DEFAULT_WEBHOOK_SECRET,
  signatureHeader = DEFAULT_WEBHOOK_SIGNATURE_HEADER,
  options,
}: {
  event: APIGatewayProxyEvent
  payload?: string | null
  secret?: string
  signatureHeader?: string
  options: VerifyOptions
}): boolean | WebhookVerificationError => {
  // const body = event.body || ''
  const signature = signatureFromEvent({ event, signatureHeader })
  const { verify } = createVerifier('timestampScheme', options) // maybe options?
  const body = payload || event.body || ''

  return verify({ body, secret, signature })
}
