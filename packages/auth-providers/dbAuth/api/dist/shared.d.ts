import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { CorsHeaders } from '@redwoodjs/api';
type ScryptOptions = {
    cost?: number;
    blockSize?: number;
    parallelization?: number;
    N?: number;
    r?: number;
    p?: number;
    maxmem?: number;
};
export declare const extractCookie: (event: APIGatewayProxyEvent | Request) => any;
export declare const isLegacySession: (text: string | undefined) => boolean;
export declare const decryptSession: (text: string | null) => any[];
export declare const encryptSession: (dataString: string) => string;
export declare const getSession: (text: string | undefined, cookieNameOption: string | undefined) => string | null;
export declare const dbAuthSession: (event: APIGatewayProxyEvent | Request, cookieNameOption: string | undefined) => any;
export declare const webAuthnSession: (event: APIGatewayProxyEvent | Request) => any;
export declare const hashToken: (token: string) => string;
export declare const hashPassword: (text: string, { salt, options, }?: {
    salt?: string;
    options?: ScryptOptions;
}) => string[];
export declare const legacyHashPassword: (text: string, salt?: string) => string[];
export declare const cookieName: (name: string | undefined) => string;
/**
 * Returns a builder for a lambda response
 *
 * This is used as the final call to return a response from the dbAuth handler
 *
 * Converts "Set-Cookie" headers to an array of strings or a multiValueHeaders
 * object
 */
export declare function getDbAuthResponseBuilder(event: APIGatewayProxyEvent | Request): (response: {
    body?: string;
    statusCode: number;
    headers?: Headers;
}, corsHeaders: CorsHeaders) => {
    statusCode: number;
    headers: Record<string, string | string[]>;
    multiValueHeaders?: Record<string, string[]>;
    body?: string;
};
export declare const extractHashingOptions: (text: string) => ScryptOptions;
export {};
//# sourceMappingURL=shared.d.ts.map