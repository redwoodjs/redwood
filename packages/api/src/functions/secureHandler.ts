import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  createVerifier,
  VerifyOptions,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from 'src/auth/verifiers'

export {
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
 * Verifies event payload is signed with a valid webhook signature.
 *
 * @param {APIGatewayProxyEvent} event - The event that includes the body for the verification payload and request details, like headers.
 * @param {string} payload - If provided, the payload will be used to verify the signature instead of the event body.
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifyWebhook({ event: event, options: {} })*
 */
export const verifyWebhook = ({
  event,
  payload,
  secret = DEFAULT_WEBHOOK_SECRET,
  options,
}: {
  event: APIGatewayProxyEvent
  payload?: string
  secret?: string
  options: VerifyOptions
}): boolean | WebhookVerificationError => {
  let body = ''

  if (payload) {
    body = payload
  } else {
    body = event.body || ''
  }

  const signature = signatureFromEvent({
    event,
    signatureHeader:
      options.signatureHeader || DEFAULT_WEBHOOK_SIGNATURE_HEADER,
  })

  const { verify } = createVerifier({ options })

  return verify({ body, secret, signature })
}

/**
 * Verifies a webhook signature given a body, secret and verifier type.
 *
 * @param {string} body -
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {string} signature -
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verify({ body, secret, signature, options: {} })*
 */
export const verify = ({
  body,
  secret = DEFAULT_WEBHOOK_SECRET,
  signature,
  options,
}: {
  body: string
  secret: string
  signature: string
  options: VerifyOptions
}): boolean | WebhookVerificationError => {
  const { verify } = createVerifier({ options })

  return verify({ body, secret, signature })
}

/**
 * Signs a payload with a secret and verifier type method
 *
 */
export const sign = ({
  payload,
  secret = DEFAULT_WEBHOOK_SECRET,
  options,
}: {
  payload: string
  secret: string
  options: VerifyOptions
}) => {
  const { sign } = createVerifier({ options })

  return sign({ body: payload, secret })
}
