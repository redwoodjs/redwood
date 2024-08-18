import type { WebhookVerifier, VerifyOptions } from './common';
export interface SecretKeyVerifier extends WebhookVerifier {
    type: 'secretKeyVerifier';
}
/**
 *
 * Secret Key Verifier
 *
 * Use when the payload is not signed, but rather authorized via a known secret key
 *
 */
declare const secretKeyVerifier: (_options?: VerifyOptions) => SecretKeyVerifier;
export default secretKeyVerifier;
//# sourceMappingURL=secretKeyVerifier.d.ts.map