import type { FlattenSearchParams } from './util.js';
type UseMatchOptions = {
    routeParams?: Record<string, any>;
    searchParams?: FlattenSearchParams;
    matchSubPaths?: boolean;
};
/**
 * Returns an object of { match: boolean; params: Record<string, unknown>; }
 * If the path matches the current location `match` will be true.
 * Params will be an object of the matched params, if there are any.
 *
 * Provide routeParams options to match specific route param values
 * Provide searchParams options to match the current location.search
 *
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 *
 * Examples:
 *
 * Match search params key existence
 * const match = useMatch('/about', { searchParams: ['category', 'page'] })
 *
 * Match search params key and value
 * const match = useMatch('/items', { searchParams: [{page: 2}, {category: 'book'}] })
 *
 * Mix match
 * const match = useMatch('/list', { searchParams: [{page: 2}, 'gtm'] })
 *
 * Match sub paths
 * const match = useMatch('/product', { matchSubPaths: true })
 *
 * Match only specific route param values
 * const match = useMatch('/product/{category}/{id}', { routeParams: { category: 'shirts' } })
 */
export declare const useMatch: (routePath: string, options?: UseMatchOptions) => {
    match: boolean;
    params?: undefined;
} | {
    match: boolean;
    params: Record<string, unknown>;
};
export {};
//# sourceMappingURL=useMatch.d.ts.map