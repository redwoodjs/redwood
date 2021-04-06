import type { VerifyOptions, WebhookVerifier } from './index'

export type None = WebhookVerifier

export const none = ({ options }: { options: VerifyOptions }): None => {
  return {
    sign: () => {
      console.warn(`No signature is created for the ${options.type} verifier`)
      return ''
    },
    verify: () => {
      console.warn(
        `The ${options.type} verifier considers all signatures valid`
      )
      return true
    },
    type: 'none',
  }
}
