import type { None } from './none'
import { none } from './none'
import type { SecretKey } from './secretKey'
import { secretKey } from './secretKey'
import type { Sha256 } from './sha256'
import { sha256 } from './sha256'
import type { TimestampScheme } from './timestampScheme'
import { timestampScheme } from './timestampScheme'

const typesToVerifiers = {
  none,
  secretKey,
  sha256,
  timestampScheme,
}

export type SupportedVerifiers = None | SecretKey | Sha256 | TimestampScheme

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
 * VerifyOptions
 *
 * Used when verifying a signature's time component for permitted leeway.
 *
 * @typedef {Object} VerifyOptions
 * @param {SupportedVerifierTypes} type - What verification type methods used
 * to sign and verify signatures
 * @param {number} tolerance - Optional tolerance in msec
 * @param {number} timestamp - Optional timestamp in msec
 */
export interface VerifyOptions {
  type: SupportedVerifierTypes
  tolerance?: number
  timestamp?: number
}

/**
 *
 */
export interface WebhookVerifier {
  sign({ body, secret }: { body: string; secret: string }): string
  verify({
    body,
    secret,
    signature,
  }: {
    body: string
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
