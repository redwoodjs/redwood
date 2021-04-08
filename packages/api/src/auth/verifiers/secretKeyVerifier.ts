import type { WebhookVerifier } from './index'
import {
  VerifyOptions,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
export type SecretKeyVerifier = WebhookVerifier

export const secretKeyVerifier = ({
  options,
}: {
  options: VerifyOptions
}): SecretKeyVerifier => {
  return {
    sign: ({ secret }) => {
      console.warn(
        `With the ${options.type} verifier, your body isn't signed with a secret`
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
