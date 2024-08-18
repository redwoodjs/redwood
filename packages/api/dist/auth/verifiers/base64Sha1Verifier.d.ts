import type { WebhookVerifier, VerifyOptions } from './common';
export interface Base64Sha1Verifier extends WebhookVerifier {
    type: 'base64Sha1Verifier';
}
export declare const verifySignature: ({ payload, secret, signature, }: {
    payload: string | Record<string, unknown>;
    secret: string;
    signature: string;
}) => boolean;
/**
 * Base64 SHA1 HMAC Payload Verifier
 *
 * Based on Svix's webhook payload verification, but using SHA1 instead
 * @see https://docs.svix.com/receiving/verifying-payloads/how-manual
 * @see https://github.com/svix/svix-webhooks/blob/main/javascript/src/index.ts
 */
declare const base64Sha1Verifier: (_options?: VerifyOptions) => Base64Sha1Verifier;
export default base64Sha1Verifier;
//# sourceMappingURL=base64Sha1Verifier.d.ts.map