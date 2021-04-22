import type { VerifyOptions, WebhookVerifier } from './index'

export interface SkipVerifier extends WebhookVerifier {}

export const skipVerifier = (
  options?: VerifyOptions | undefined
): SkipVerifier => {
  if (options) {
    console.warn(`VerifyOptions are ignored for the skipVerifier verifier`)
  }
  return {
    sign: () => {
      console.warn(`No signature is created for the skipVerifier verifier`)
      return ''
    },
    verify: () => {
      console.warn(`The skipVerifier verifier considers all signatures valid`)
      return true
    },
    type: 'skipVerifier',
  }
}
