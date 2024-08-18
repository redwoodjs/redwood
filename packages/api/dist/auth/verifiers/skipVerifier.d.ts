import type { VerifyOptions, WebhookVerifier } from './common';
export interface SkipVerifier extends WebhookVerifier {
    type: 'skipVerifier';
}
/**
 * skipVerifier skips webhook signature verification.
 * Use when there is no signature provided or the webhook is
 * entirely public.
 *
 */
declare const skipVerifier: (_options?: VerifyOptions) => SkipVerifier;
export default skipVerifier;
//# sourceMappingURL=skipVerifier.d.ts.map