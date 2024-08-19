import type { SupabaseClient } from '@supabase/supabase-js';
import type { MiddlewareRequest, MiddlewareResponse } from '@redwoodjs/web/middleware';
/**
 * Creates Supabase Server Client used to get the session cookie (only)
 * from a given collection of auth cookies
 */
export declare const createSupabaseServerClient: (req: MiddlewareRequest, res: MiddlewareResponse) => {
    cookieName: string | null;
    supabase: SupabaseClient;
};
/**
 * Clear the Supabase and auth cookies from the request and response
 * and clear the auth context
 */
export declare const clearAuthState: (req: MiddlewareRequest, res: MiddlewareResponse) => void;
//# sourceMappingURL=util.d.ts.map