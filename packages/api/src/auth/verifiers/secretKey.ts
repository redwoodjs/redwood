import type { WebhookVerifier } from './index'
import {
  VerifyOptions,
  WebhookVerificationError,
  VERIFICATION_ERROR_MESSAGE,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
export type SecretKey = WebhookVerifier

export const secretKey = (options?: VerifyOptions): SecretKey => {
  return {
    sign: () => {
      console.log(options)
      return ''
    },
    verify: ({ signature, secret = DEFAULT_WEBHOOK_SECRET }) => {
      const verified = signature === secret

      if (!verified) {
        throw new WebhookVerificationError(VERIFICATION_ERROR_MESSAGE)
      }

      return verified
    },
    type: 'secretKey',
  }
}
