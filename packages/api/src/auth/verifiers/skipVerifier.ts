import type { VerifyOptions, WebhookVerifier } from './index'

export type SkipVerifier = WebhookVerifier

export const skipVerifier = ({
  options,
}: {
  options: VerifyOptions
}): SkipVerifier => {
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
    type: 'skipVerifier',
  }
}
