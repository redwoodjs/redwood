import type { ReactNode } from 'react';
export declare function flattenAll(children: ReactNode): ReactNode[];
/**
 * Get param name, type, and match for a route.
 *
 *  '/blog/{year}/{month}/{day:Int}/{filePath...}'
 *   => [
 *        ['year',     'String', '{year}'],
 *        ['month',    'String', '{month}'],
 *        ['day',      'Int',    '{day:Int}'],
 *        ['filePath', 'Glob',   '{filePath...}']
 *      ]
 *
 * Only exported to be able to test it
 */
export declare function paramsForRoute(route: string): string[][];
export type TrailingSlashesTypes = 'never' | 'always' | 'preserve';
export interface ParamType {
    match?: RegExp;
    parse?: (value: any) => unknown;
}
/**
 * Determine if the given route is a match for the given pathname. If so,
 * extract any named params and return them in an object.
 *
 * route         - The route path as specified in the <Route path={...} />
 * pathname      - The pathname from the window.location.
 * paramTypes    - The object containing all param type definitions.
 * matchSubPaths - Also match sub routes
 *
 * Examples:
 *
 *  matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')
 *  => { match: true, params: { year: '2019', month: '12', day: '07' }}
 *
 *  matchPath('/about', '/')
 *  => { match: false }
 *
 *  matchPath('/post/{id:Int}', '/post/7')
 *  => { match: true, params: { id: 7 }}
 *
 *  matchPath('/post/1', '/post/', { matchSubPaths: true })
 *  => { match: true, params: {} }
 */
export declare function matchPath(routeDefinition: string, pathname: string, { userParamTypes, matchSubPaths, }?: {
    userParamTypes?: Record<string, ParamType>;
    matchSubPaths?: boolean;
}): {
    match: boolean;
    params?: undefined;
} | {
    match: boolean;
    params: Record<string, unknown>;
};
interface GetRouteRegexOptions {
    matchSubPaths?: boolean;
    allParamTypes?: Record<string, ParamType>;
}
/**
 *  This function will return a regex for each route path i.e. /blog/{year}/{month}/{day}
 *  will return a regex like /blog/([^/$1*]+)/([^/$1*]+)/([^/$1*]+)
 *
 * @returns
 */
export declare function getRouteRegexAndParams(route: string, { matchSubPaths, allParamTypes, }?: GetRouteRegexOptions | undefined): {
    matchRegex: RegExp;
    routeParams: string[][];
    matchRegexString: string;
};
/**
 * Parse the given search string into key/value pairs and return them in an
 * object.
 *
 * Examples:
 *
 *  parseSearch('?key1=val1&key2=val2')
 *  => { key1: 'val1', key2: 'val2' }
 *
 * @fixme
 * This utility ignores keys with multiple values such as `?foo=1&foo=2`.
 */
export declare function parseSearch(search: string | string[][] | Record<string, string> | URLSearchParams | undefined): {};
/**
 * Validate a path to make sure it follows the router's rules. If any problems
 * are found, a descriptive Error will be thrown, as problems with routes are
 * critical enough to be considered fatal.
 */
export declare function validatePath(path: string, routeName: string): void;
/**
 * Take a given route path and replace any named parameters with those in the
 * given args object. Any extra params not used in the path will be appended
 * as key=value pairs in the search part.
 *
 * Examples:
 *
 *   replaceParams('/tags/{tag}', { tag: 'code', extra: 'foo' })
 *   => '/tags/code?extra=foo
 */
export declare function replaceParams(route: string, args?: Record<string, unknown>): string;
export type FlattenSearchParams = ReturnType<typeof flattenSearchParams>;
/**
 * Returns a flat array of search params
 *
 * `useMatch` hook options `searchParams` requires a flat array
 *
 * Example:
 * ```
 *   parseSearch('?key1=val1&key2=val2')
 *   => { key1: 'val1', key2: 'val2' }
 *
 *   flattenSearchParams(parseSearch('?key1=val1&key2=val2'))
 *   => [ { key1: 'val1' }, { key2: 'val2' } ]
 * ```
 */
export declare function flattenSearchParams(queryString: string): Record<string, unknown>[];
/**
 * Detect if we're in an iframe.
 *
 * From https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
 */
export declare function inIframe(): boolean;
export {};
//# sourceMappingURL=util.d.ts.map