import type { WebhookVerifier, VerifyOptions } from './common';
export interface Sha1Verifier extends WebhookVerifier {
    type: 'sha1Verifier';
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
 * SHA1 HMAC Payload Verifier
 *
 * Based on Vercel's webhook payload verification
 * @see https://vercel.com/docs/api#integrations/webhooks/securing-webhooks
 *
 */
declare const sha1Verifier: (_options?: VerifyOptions) => Sha1Verifier;
export default sha1Verifier;
//# sourceMappingURL=sha1Verifier.d.ts.map