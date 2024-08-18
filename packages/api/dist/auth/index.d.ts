export * from './parseJWT';
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda';
import type { Decoded } from './parseJWT';
export type { Decoded };
export declare const AUTH_PROVIDER_HEADER = "auth-provider";
export declare const getAuthProviderHeader: (event: APIGatewayProxyEvent | Request) => string | null | undefined;
export interface AuthorizationHeader {
    schema: 'Bearer' | 'Basic' | string;
    token: string;
}
export type AuthorizationCookies = {
    parsedCookie: Record<string, string>;
    rawCookie: string;
    type: string;
} | null;
export declare const parseAuthorizationCookie: (event: APIGatewayProxyEvent | Request) => AuthorizationCookies;
/**
 * Split the `Authorization` header into a schema and token part.
 */
export declare const parseAuthorizationHeader: (event: APIGatewayProxyEvent | Request) => AuthorizationHeader;
/** @MARK Note that we do not send LambdaContext when making fetch requests
 *
 * This part is incomplete, as we need to decide how we will make the breaking change to
 * 1. getCurrentUser
 * 2. authDecoders

 */
export type AuthContextPayload = [
    Decoded,
    {
        type: string;
    } & AuthorizationHeader,
    {
        event: APIGatewayProxyEvent | Request;
        context?: LambdaContext;
    }
];
export type Decoder = (token: string, type: string, req: {
    event: APIGatewayProxyEvent | Request;
    context?: LambdaContext;
}) => Promise<Decoded>;
/**
 * Get the authorization information from the request headers and request context.
 * @returns [decoded, { type, schema, token }, { event, context }]
 **/
export declare const getAuthenticationContext: ({ authDecoder, event, context, }: {
    authDecoder?: Decoder | Decoder[];
    event: APIGatewayProxyEvent | Request;
    context: LambdaContext;
}) => Promise<undefined | AuthContextPayload>;
//# sourceMappingURL=index.d.ts.map