import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { DbAuthResponse } from '@redwoodjs/auth-dbauth-api';
import type { GetCurrentUser } from '@redwoodjs/graphql-server';
import type { Middleware } from '@redwoodjs/web/middleware';
export interface DbAuthMiddlewareOptions {
    cookieName?: string;
    dbAuthUrl?: string;
    dbAuthHandler: (req: Request | APIGatewayProxyEvent, context?: Context) => DbAuthResponse;
    getRoles?: (decoded: any) => string[];
    getCurrentUser: GetCurrentUser;
}
export declare const initDbAuthMiddleware: ({ dbAuthHandler, getCurrentUser, getRoles, cookieName, dbAuthUrl, }: DbAuthMiddlewareOptions) => [Middleware, "*"];
export default initDbAuthMiddleware;
//# sourceMappingURL=index.d.ts.map