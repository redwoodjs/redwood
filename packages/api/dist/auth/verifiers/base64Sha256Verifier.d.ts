import type { WebhookVerifier, VerifyOptions } from './common';
export interface Base64Sha256Verifier extends WebhookVerifier {
    type: 'base64Sha256Verifier';
}
export declare const verifySignature: ({ payload, secret, signature, }: {
    payload: string | Record<string, unknown>;
    secret: string;
    signature: string;
}) => boolean;
/**
 * Base64 SHA256 HMAC Payload Verifier
 *
 * Based on Svix's webhook payload verification
 * @see https://docs.svix.com/receiving/verifying-payloads/how-manual
 * @see https://github.com/svix/svix-webhooks/blob/main/javascript/src/index.ts
 */
declare const base64Sha256Verifier: (_options?: VerifyOptions) => Base64Sha256Verifier;
export default base64Sha256Verifier;
//# sourceMappingURL=base64Sha256Verifier.d.ts.map