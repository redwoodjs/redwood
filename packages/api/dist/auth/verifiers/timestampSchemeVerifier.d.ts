import type { WebhookVerifier, VerifyOptions } from './common';
export interface TimestampSchemeVerifier extends WebhookVerifier {
    type: 'timestampSchemeVerifier';
}
/**
 *
 * Timestamp & Scheme Verifier
 *
 * Based on Stripe's secure webhook implementation
 *
 * @see https://stripe.com/docs/webhooks/signatures
 *
 */
declare const timestampSchemeVerifier: (options?: VerifyOptions) => TimestampSchemeVerifier;
export default timestampSchemeVerifier;
//# sourceMappingURL=timestampSchemeVerifier.d.ts.map