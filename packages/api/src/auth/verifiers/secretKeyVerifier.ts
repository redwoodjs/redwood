import { WebhookVerificationError, DEFAULT_WEBHOOK_SECRET } from './common'
import type { WebhookVerifier, VerifyOptions } from './common'

export interface SecretKeyVerifier extends WebhookVerifier {
  type: 'secretKeyVerifier'
}

export const secretKeyVerifier = (
  options?: VerifyOptions | undefined
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

export default secretKeyVerifier
