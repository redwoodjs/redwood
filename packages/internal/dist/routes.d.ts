export interface RouteInformation {
    name?: string;
    path?: string;
    page?: string;
}
/**
 * Returns an array of routes which conflict on their defined names
 */
export declare function getDuplicateRoutes(): RouteInformation[];
/**
 * Detects any potential duplicate routes and returns a formatted warning message
 * @see {@link getDuplicateRoutes} for how duplicate routes are detected
 * @return {string} Warning message when duplicate routes found, empty string if not
 */
export declare function warningForDuplicateRoutes(): string;
export interface RWRouteManifestItem {
    name: string;
    pathDefinition: string;
    matchRegexString: string | null;
    routeHooks: string | null;
    bundle: string | null;
    hasParams: boolean;
    relativeFilePath: string;
    redirect: {
        to: string;
        permanent: boolean;
    } | null;
    isPrivate: boolean;
    unauthenticated: string | null;
    roles: string | string[] | null;
    pageIdentifier: string | null;
}
export interface RouteSpec extends RWRouteManifestItem {
    id: string;
    isNotFound: boolean;
    filePath: string | undefined;
    isPrivate: boolean;
    unauthenticated: string | null;
    relativeFilePath: string;
}
export declare const getProjectRoutes: () => RouteSpec[];
//# sourceMappingURL=routes.d.ts.map