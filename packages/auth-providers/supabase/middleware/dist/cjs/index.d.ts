import type { GetCurrentUser } from '@redwoodjs/graphql-server';
import type { Middleware } from '@redwoodjs/web/middleware';
export interface SupabaseAuthMiddlewareOptions {
    getCurrentUser: GetCurrentUser;
    getRoles?: (decoded: any) => string[];
}
/**
 * Create Supabase Auth Middleware that sets the `serverAuthState` based on the Supabase cookie.
 */
declare const initSupabaseAuthMiddleware: ({ getCurrentUser, getRoles, }: SupabaseAuthMiddlewareOptions) => [Middleware, "*"];
export default initSupabaseAuthMiddleware;
//# sourceMappingURL=index.d.ts.map