import type { ReactNode, ReactElement } from 'react';
import type { InternalRouteProps, NotFoundRouteProps, RedirectRouteProps, RouteProps } from './Route.js';
/**
 * Narrows down the type of the Route element to RouteProps
 *
 * It means that it is not a notfound page or a redirected route
 */
export declare function isStandardRoute(node: ReactElement<InternalRouteProps>): node is ReactElement<RouteProps>;
/** Checks if a Route element is a Redirect Route */
export declare function isRedirectRoute(node: ReactElement<InternalRouteProps>): node is ReactElement<RedirectRouteProps>;
/** Checks if a Route element is a NotFound Route */
export declare function isNotFoundRoute(node: ReactElement<InternalRouteProps>): node is ReactElement<NotFoundRouteProps>;
/**
 * Check that the Route element is ok
 * and that it could be one of the following:
 * <Route redirect .../>  (redirect Route)
 * <Route notfound .../>  (notfound Route)
 * <Route .../> (standard Route)
 */
export declare function isValidRoute(node: ReactNode): node is ReactElement<InternalRouteProps>;
//# sourceMappingURL=route-validators.d.ts.map