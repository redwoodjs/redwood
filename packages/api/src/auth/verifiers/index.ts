import {
  jwtVerifier,
  JwtVerifier,
  secretKeyVerifier,
  SecretKeyVerifier,
  sha1Verifier,
  Sha1Verifier,
  sha256Verifier,
  Sha256Verifier,
  skipVerifier,
  SkipVerifier,
  timestampSchemeVerifier,
  TimestampSchemeVerifier,
} from './types'

const typesToVerifiers = {
  skipVerifier,
  secretKeyVerifier,
  sha1Verifier,
  sha256Verifier,
  timestampSchemeVerifier,
  jwtVerifier,
}

export type SupportedVerifiers =
  | SkipVerifier
  | SecretKeyVerifier
  | Sha1Verifier
  | Sha256Verifier
  | Sha1Verifier
  | TimestampSchemeVerifier
  | JwtVerifier

export type SupportedVerifierTypes = keyof typeof typesToVerifiers

/**
 * @const {string}
 */
export const DEFAULT_WEBHOOK_SECRET = process.env['WEBHOOK_SECRET'] ?? ''

/**
 * @const {string}
 */
export const VERIFICATION_ERROR_MESSAGE =
  "You don't have access to invoke this function."

/**
 * @const {string}
 */
export const VERIFICATION_SIGN_MESSAGE = 'Unable to sign payload'

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
  constructor(message?: string) {
    super(message || VERIFICATION_ERROR_MESSAGE)
  }
}

/**
 * Class representing a WebhookSignError
 * @extends WebhookError
 */
export class WebhookSignError extends WebhookError {
  /**
   * Create a WebhookSignError.
   * @param {string} message - The error message
   * */
  constructor(message?: string) {
    super(message || VERIFICATION_SIGN_MESSAGE)
  }
}

/**
 * VerifyOptions
 *
 * Used when verifying a signature based on the verifier's requirements
 *
 * @param {string} signatureHeader - Optional Header that contains the signature to verify
 * will default to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @param {number} timestamp - Optional timestamp in msec
 * @param {number} tolerance - Optional tolerance in msec
 * @param {string} issuer - Options JWT issuer for JWTVerifier
 */
export interface VerifyOptions {
  signatureHeader?: string
  timestamp?: number
  tolerance?: number
  issuer?: string
}

/**
 * WebhookVerifier is the interface for all verifiers
 */
export interface WebhookVerifier {
  sign({
    payload,
    secret,
  }: {
    payload: string | Record<string, unknown>
    secret: string
  }): string
  verify({
    payload,
    secret,
    signature,
  }: {
    payload: string | Record<string, unknown>
    secret: string
    signature: string
  }): boolean | WebhookVerificationError
  type: SupportedVerifierTypes
}

/**
 * @param {SupportedVerifierTypes} type - What verification type methods used
 * to sign and verify signatures
 * @param {VerifyOptions} options - Options used to verify the signature based on verifiers requirements
 */
export const createVerifier = (
  type: SupportedVerifierTypes,
  options?: VerifyOptions | undefined
): WebhookVerifier => {
  if (options) {
    return typesToVerifiers[type](options)
  } else {
    return typesToVerifiers[type]()
  }
}
