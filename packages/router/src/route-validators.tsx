import type { ReactNode, ReactElement } from 'react'
import { isValidElement } from 'react'

import type { RouteProps } from './router'
import { Route } from './router'
import type { Spec } from './util'

export type RenderMode = 'stream' | 'html'

export type PageType =
  | Spec
  | React.ComponentType<any>
  | ((props: any) => JSX.Element)

// @MARK a redirect route should just be a standard route, with
// the extra redirect prop
// @TODO
// why can't a redirect route have a name?
// if you put a redirect prop on a route, you should still be able
// to call routes.myRouteName()
export interface RedirectRouteProps {
  redirect: string
  path: string
  name?: string
}

export interface NotFoundRouteProps {
  notfound: boolean
  page: PageType
  prerender?: boolean
  renderMode?: RenderMode
}

export type InternalRouteProps = Partial<
  RouteProps & RedirectRouteProps & NotFoundRouteProps
>

const isNodeTypeRoute = (
  node: ReactNode
): node is ReactElement<InternalRouteProps> => {
  return isValidElement(node) && node.type === Route
}
/**
 * Narrows down the type of the Route element to RouteProps
 *
 * It means that it is not a notfound page or a redirected route
 *
 * @param node
 * @returns boolean
 */

export function isStandardRoute(
  node: ReactElement<InternalRouteProps>
): node is ReactElement<RouteProps> {
  return !node.props.notfound && !node.props.redirect
}
/**
 *
 * Checks if a Route element is a Redirect Route
 *
 * @param node
 * @returns
 */

export function isRedirectRoute(
  node: ReactElement<InternalRouteProps>
): node is ReactElement<RedirectRouteProps> {
  return !!node.props.redirect
}
/**
 *
 * Checks if a Route element is a Redirect Route
 *
 * @param node
 * @returns
 */

export function isNotFoundRoute(
  node: ReactElement<InternalRouteProps>
): node is ReactElement<NotFoundRouteProps> {
  return !!node.props.notfound
}
/**
 * Check that the Route element is ok
 * and that it could be one of the following:
 * <Route redirect .../>  (ridirect Route)
 * <Route notfound .../>  (notfound Route)
 * <Route .../> (standard Route)
 *
 * @param node
 * @returns boolean
 */

export function isValidRoute(
  node: ReactNode
): node is ReactElement<InternalRouteProps> {
  const isValidRouteElement = isNodeTypeRoute(node)

  // Throw inside here, because we know it's a Route otherwise it could be a Set or Private
  if (isValidRouteElement) {
    const notFoundOrRedirect = node.props.notfound || node.props.redirect
    const requiredKeys = [
      !node.props.notfound && 'path',
      !node.props.redirect && 'page', // redirects dont need an actual page, but notfound and standard do
      !notFoundOrRedirect && 'name', // this not so sure about! Redirects should have names too, but maybe we don't need to throw an error for it
    ].filter(Boolean) as string[]

    const missingKeys = requiredKeys.filter((key) => !(key in node.props))

    if (missingKeys.length > 0) {
      const stringToHelpIdentify =
        node.props.name || node.props.path
          ? `for "${node.props.name || node.props.path}" `
          : ''
      throw new Error(
        `Route element ${stringToHelpIdentify}is missing required props: ${missingKeys.join(
          ', '
        )}`
      )
    }
  }

  return isValidRouteElement
}
