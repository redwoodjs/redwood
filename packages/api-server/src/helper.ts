import { routePrefix } from './index'

/**
 * Get route prefix that adds trailing slash (e.g. /api is treated as /api/)
 *
 * @return  string    Route prefix
 */
export const getRoutePrefix = () => {
  const prefix = routePrefix.charAt(routePrefix.length - 1) === '/' ? routePrefix : `${routePrefix}/`

  return prefix
}