import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { VerifyOptions, SupportedVerifierTypes } from '../auth/verifiers';
import { WebhookVerificationError } from '../auth/verifiers';
export { VerifyOptions, WebhookVerificationError, DEFAULT_WEBHOOK_SECRET, SupportedVerifierTypes, } from '../auth/verifiers';
export declare const DEFAULT_WEBHOOK_SIGNATURE_HEADER = "RW-WEBHOOK-SIGNATURE";
/**
 * Extracts signature from Lambda Event.
 *
 * @param {APIGatewayProxyEvent} event - The event that includes the request details, like headers
 * @param {string} signatureHeader - The name of header key that contains the signature; defaults to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @return {string} - The signature found in the headers specified by signatureHeader
 *
 * @example
 *
 *    signatureFromEvent({ event: event })
 */
export declare const signatureFromEvent: ({ event, signatureHeader, }: {
    event: APIGatewayProxyEvent;
    signatureHeader: string;
}) => string;
/**
 * Verifies event payload is signed with a valid webhook signature.
 *
 * @param {APIGatewayProxyEvent} event - The event that includes the body for the verification payload and request details, like headers.
 * @param {string} payload - If provided, the payload will be used to verify the signature instead of the event body.
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifyEvent({ event: event, options: {} })*
 */
export declare const verifyEvent: (type: SupportedVerifierTypes, { event, payload, secret, options, }: {
    event: APIGatewayProxyEvent;
    payload?: string;
    secret?: string;
    options?: VerifyOptions | undefined;
}) => boolean | WebhookVerificationError;
/**
 * Standalone verification of webhook signature given a payload, secret, verifier type and options.
 *
 * @param {string} payload - Body content of the event
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {string} signature - Signature that verifies that the event
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifySignature({ payload, secret, signature, options: {} })*
 */
export declare const verifySignature: (type: SupportedVerifierTypes, { payload, secret, signature, options, }: {
    payload: string | Record<string, unknown>;
    secret: string;
    signature: string;
    options?: VerifyOptions | undefined;
}) => boolean | WebhookVerificationError;
/**
 * Signs a payload with a secret and verifier type method
 *
 * @param {string} payload - Body content of the event to sign
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {string} - Returns signature
 *
 * @example
 *
 *    signPayload({ payload, secret, options: {} })*
 */
export declare const signPayload: (type: SupportedVerifierTypes, { payload, secret, options, }: {
    payload: string;
    secret: string;
    options?: VerifyOptions | undefined;
}) => string;
//# sourceMappingURL=index.d.ts.map