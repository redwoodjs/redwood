import type { WebhookVerifier } from './index'
import {
  VerifyOptions,
  WebhookVerificationError,
  DEFAULT_WEBHOOK_SECRET,
} from './index'
export type SecretKey = WebhookVerifier

export const secretKey = ({
  options,
}: {
  options: VerifyOptions
}): SecretKey => {
  return {
    sign: () => {
      console.log(options)
      return ''
    },
    verify: ({ signature, secret = DEFAULT_WEBHOOK_SECRET }) => {
      const verified = signature === secret

      if (!verified) {
        throw new WebhookVerificationError()
      }

      return verified
    },
    type: 'secretKey',
  }
}
