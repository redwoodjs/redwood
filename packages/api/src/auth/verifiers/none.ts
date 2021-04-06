import type { VerifyOptions, WebhookVerifier } from './index'

export type None = WebhookVerifier

export const none = (options?: VerifyOptions): None => {
  return {
    sign: () => {
      console.log(options)
      return ''
    },
    verify: () => {
      return true
    },
    type: 'none',
  }
}
