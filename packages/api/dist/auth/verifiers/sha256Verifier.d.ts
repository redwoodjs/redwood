import type { WebhookVerifier, VerifyOptions } from './common';
export interface Sha256Verifier extends WebhookVerifier {
    type: 'sha256Verifier';
}
/**
 *
 * verifySignature
 *
 */
export declare const verifySignature: ({ payload, secret, signature, }: {
    payload: string | Record<string, unknown>;
    secret: string;
    signature: string;
}) => boolean;
/**
 *
 * SHA256 HMAC Payload Verifier
 *
 * Based on GitHub's webhook payload verification
 * @see https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks
 *
 */
declare const sha256Verifier: (_options?: VerifyOptions) => Sha256Verifier;
export default sha256Verifier;
//# sourceMappingURL=sha256Verifier.d.ts.map