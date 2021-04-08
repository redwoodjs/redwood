import type { JwtVerifier } from './jwtVerifier'
import { jwtVerifier } from './jwtVerifier'
import type { SecretKeyVerifier } from './secretKeyVerifier'
import { secretKeyVerifier } from './secretKeyVerifier'
import type { Sha256Verifier } from './sha256Verifier'
import { sha256Verifier } from './sha256Verifier'
import { skipVerifier } from './skipVerifier'
import type { SkipVerifier } from './skipVerifier'
import type { TimestampSchemeVerifier } from './timestampSchemeVerifier'
import { timestampSchemeVerifier } from './timestampSchemeVerifier'

const typesToVerifiers = {
  skipVerifier,
  secretKeyVerifier,
  sha256Verifier,
  timestampSchemeVerifier,
  jwtVerifier,
}

export type SupportedVerifiers =
  | SkipVerifier
  | SecretKeyVerifier
  | Sha256Verifier
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
 * Used when verifying a signature's time component for permitted leeway.
 *
 * @typedef {Object} VerifyOptions
 * @param {SupportedVerifierTypes} type - What verification type methods used
 * to sign and verify signatures
 * @param {string} signatureHeader - Optional Header that contains the signature to verify
 * will default to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @param {number} timestamp - Optional timestamp in msec
 * @param {number} tolerance - Optional tolerance in msec
 * @param {string} issuer - Options JWT issuer for JWTVerifier
 */
export interface VerifyOptions {
  type: SupportedVerifierTypes
  signatureHeader?: string
  timestamp?: number
  tolerance?: number
  issuer?: string
}

/**
 *
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
 *
 */
export const createVerifier = ({
  options,
}: {
  options: VerifyOptions
}): WebhookVerifier => {
  return typesToVerifiers[options.type]({ options })
}
