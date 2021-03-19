import { routePrefix } from './index'

/**
 * Get route prefix that adds trailing slash (e.g. /api is treated as /api/)
 *
 * @return  string    Route prefix
 */
export const getRoutePrefix = (): string => {
  const prefix = routePrefix.charAt(0) !== '/' ? '/' : ''
  const suffix = routePrefix.charAt(routePrefix.length - 1) !== '/' ? '/' : ''

  // Construct route prefix
  const route = `${prefix}${routePrefix}${suffix}`

  return route
}
