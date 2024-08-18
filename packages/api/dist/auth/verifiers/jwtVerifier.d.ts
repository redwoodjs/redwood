import type { WebhookVerifier, VerifyOptions } from './common';
export interface JwtVerifier extends WebhookVerifier {
    type: 'jwtVerifier';
}
/**
 *
 * verifySignature
 *
 */
export declare const verifySignature: ({ payload, secret, signature, options, }: {
    payload: string | Record<string, unknown>;
    secret: string;
    signature: string;
    options: VerifyOptions | undefined;
}) => boolean;
/**
 *
 * JWT Payload Verifier
 *
 * Based on Netlify's webhook payload verification
 * @see: https://docs.netlify.com/site-deploys/notifications/#payload-signature
 *
 */
export declare const jwtVerifier: (options?: VerifyOptions) => JwtVerifier;
export default jwtVerifier;
//# sourceMappingURL=jwtVerifier.d.ts.map