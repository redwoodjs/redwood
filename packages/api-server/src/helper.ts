import { routePrefix } from './index'

/**
 * Get api route prefix from option --routePrefix and add start and ending slash (/)
 *
 * @example
 *
 * --routePrefix api
 * --routePrefix api/
 * --routePrefix /api
 * --routePrefix /api/
 *
 *   returns: /api/
 *
 * @return  string    Api route prefix with start and ending slash (/)
 */
export const getRoutePrefix = (): string => {
  const prefix = routePrefix.charAt(0) !== '/' ? '/' : ''
  const suffix = routePrefix.charAt(routePrefix.length - 1) !== '/' ? '/' : ''

  return `${prefix}${routePrefix}${suffix}`
}
