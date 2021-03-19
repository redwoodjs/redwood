import { routePrefix } from './index'

/**
 * Get route prefix that adds trailing slash (e.g. /api is treated as /api/)
 *
 * @return  string    Route prefix
 */
export const getRoutePrefix = (): string => {
  // Make sure we start and end with /, e.g. /api/
  const prefix = routePrefix.charAt(0) !== '/' ? '/' : ''
  const suffix = routePrefix.charAt(routePrefix.length - 1) !== '/' ? '/' : ''

  return `${prefix}${routePrefix}${suffix}`
}
