import type { APIGatewayProxyEvent } from 'aws-lambda';
export interface PartialRequest<TBody = Record<string, any>> {
    jsonBody: TBody;
    headers: Headers;
    method: string;
    query: any;
}
/**
 * Extracts and parses body payload from event with base64 encoding check
 */
export declare const parseLambdaEventBody: (event: APIGatewayProxyEvent) => any;
/**
 * Extracts and parses body payload from Fetch Request
 * with check for empty body
 *
 * NOTE: whatwg/server expects that you will decode the base64 body yourself
 * see readme here: https://github.com/ardatan/whatwg-node/tree/master/packages/server#aws-lambda
 */
export declare const parseFetchEventBody: (event: Request) => Promise<any>;
export declare const isFetchApiRequest: (event: Request | APIGatewayProxyEvent) => event is Request;
/**
 *
 * This function returns a an object that lets you access _some_ of the request properties in a consistent way
 * You can give it either a LambdaEvent or a Fetch API Request
 *
 * NOTE: It does NOT return a full Request object!
 */
export declare function normalizeRequest(event: APIGatewayProxyEvent | Request): Promise<PartialRequest>;
/**
 * Useful for removing nulls from an object, such as an input from a GraphQL mutation used directly in a Prisma query
 * @param input - Object to remove nulls from
 * See {@link https://www.prisma.io/docs/concepts/components/prisma-client/null-and-undefined Prisma docs: null vs undefined}
 */
export declare const removeNulls: (input: Record<number | symbol | string, any>) => Record<string | number | symbol, any>;
//# sourceMappingURL=transforms.d.ts.map