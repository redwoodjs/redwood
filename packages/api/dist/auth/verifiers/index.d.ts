import type { SupportedVerifierTypes, VerifyOptions, WebhookVerifier } from './common';
/**
 * @param {SupportedVerifierTypes} type - What verification type methods used to sign and verify signatures
 * @param {VerifyOptions} options - Options used to verify the signature based on verifiers requirements
 */
export declare const createVerifier: (type: SupportedVerifierTypes, options?: VerifyOptions) => WebhookVerifier;
export * from './common';
//# sourceMappingURL=index.d.ts.map