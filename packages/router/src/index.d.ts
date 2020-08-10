import type React from 'react'

declare module '@redwoodjs/router' {
  type namedRoute = string

  const Route: React.FunctionComponent<{
    /** The URL path to match, starting with the beginning slash */
    path: string
    /** The Page component to render when the path is matched. */
    page: React.ReactElement
    /** Used to specify the name of the _named route function_ */
    name: namedRoute
    redirect?: namedRoute
    /** The route marked notfound is displayed when a page can not be found */
    notfound?: boolean
  }>

  /**
   * Some pages should only be visible to authenticated users.
   * All `<Routes />` nested in `<Private>` require authentication.
   */
  const Private: React.FunctionComponent<{
    /**
     * When a user is not authenticated and attempts to visit a route within private,
     * they will be redirected to the route name passed to `unauthenticated`.
     */
    unauthenticated: namedRoute
    children: Array<typeof Route>
  }>

  const Router: React.FunctionComponent<{
    children: Array<typeof Route | typeof Private>
    // TODO: paramTypes
    // TODO: pageLoadingDelay
  }>

  /**
   * Programmatically navigate to a different page.
   *
   * @example
   * ```js
   * // SomePage.js
   * import { navigate, routes } from '@redwoodjs/router'
   *
   * const SomePage = () => (
   *  <Button
   *    onClick={() => navigate(route.home())}>
   *      Click me
   *  </Button>
   * )
   * ```
   */
  function navigate(nameOfRoute: namedRoute)

  // TODO Convert any types to correct typings
  const Redirect: any
  const Link: any
  const NavLink: any
  const route: any
  const routes: any
  const useLocation: any
  const useParams: any
  const useMatch: any
  const usePageLoadingContext: any
}
