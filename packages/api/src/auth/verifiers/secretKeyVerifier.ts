import type { WebhookVerifier } from './index'
import {
  VerifyOptions,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from './index'

export interface SecretKeyVerifier extends WebhookVerifier {}

export const secretKeyVerifier = (
  options?: VerifyOptions
): SecretKeyVerifier => {
  if (options) {
    console.warn(
      `With the SecretKeyVerifier verifier, VerifyOptions are ignored`
    )
  }
  return {
    sign: ({ secret }) => {
      console.warn(
        `With the SecretKeyVerifier verifier, your body isn't signed with a secret`
      )
      return secret
    },
    verify: ({ signature, secret = DEFAULT_WEBHOOK_SECRET }) => {
      const verified = signature === secret

      if (!verified) {
        throw new WebhookVerificationError()
      }

      return verified
    },
    type: 'secretKeyVerifier',
  }
}
