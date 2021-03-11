import { routePrefix } from './index'

/**
 * Get route prefix that adds trailing slash (e.g. /api is treated as /api/)
 *
 * @return  string    Route prefix
 */
export const getRoutePrefix = () => {
  const lastCharacter = routePrefix.charAt(routePrefix.length - 1)
  const prefix = lastCharacter === '/' ? routePrefix : `${routePrefix}/`

  return prefix
}
