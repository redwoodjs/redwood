import type { LocationContextType } from './location'
import { useLocation } from './location'
import { matchPath } from './util'
import type { FlattenSearchParams } from './util'

type UseMatchOptions = {
  searchParams?: FlattenSearchParams
  matchSubPaths?: boolean
}

/**
 * Returns an object of { match: boolean; params: Record<string, unknown>; }
 * if the path matches the current location match will be true.
 * Params will be an object of the matched params, if there are any.
 *
 * Provide searchParams options to match the current location.search
 *
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 *
 * Examples:
 *
 * Match search params key existence
 * const match = useMatch('/about', { searchParams: ['category', 'page'] })
 *
 * Match search params key and value
 * const match = useMatch('/items', { searchParams: [{page: 2}, {category: 'book'}] })
 *
 * Mix match
 * const match = useMatch('/list', { searchParams: [{page: 2}, 'gtm'] })
 *
 * Match sub paths
 * const match = useMatch('/product', { matchSubPaths: true })
 */
export const useMatch = (pathname: string, options?: UseMatchOptions) => {
  return useLocationMatch(useLocation(), pathname, options)
}

export const useLocationMatch = (
  location: LocationContextType,
  pathname: string,
  options?: UseMatchOptions
) => {
  if (!location) {
    return { match: false, params: undefined }
  }

  if (options?.searchParams) {
    const locationParams = new URLSearchParams(location.search)
    const hasUnmatched = options.searchParams.some((param) => {
      if (typeof param === 'string') {
        return !locationParams.has(param)
      } else {
        return Object.keys(param).some(
          (key) => param[key] != locationParams.get(key)
        )
      }
    })

    if (hasUnmatched) {
      return { match: false, params: undefined }
    }
  }

  return matchPath(pathname, location.pathname, {
    matchSubPaths: options?.matchSubPaths,
  })
}
