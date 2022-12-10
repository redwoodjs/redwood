import { forwardRef, useEffect } from 'react'

import { navigate, NavigateOptions } from './history'
import { useLocation } from './location'
import { flattenSearchParams, matchPath, matchSubPath } from './util'

type FlattenSearchParams = ReturnType<typeof flattenSearchParams>
type UseMatchOptions = {
  searchParams?: FlattenSearchParams
  matchSubRoutes?: boolean
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
 * Match child routes
 * const match = useMatch('/product', { matchChildRoutes: true })
 *
 */
const useMatch = (pathname: string, options?: UseMatchOptions) => {
  const location = useLocation()
  if (!location) {
    return { match: false }
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
      return { match: false }
    }
  }

  return options?.matchSubRoutes
    ? matchSubPath(pathname, location.pathname)
    : matchPath(pathname, location.pathname)
}

interface LinkProps {
  to: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const Link = forwardRef<
  HTMLAnchorElement,
  LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ to, onClick, ...rest }, ref) => (
  <a
    href={to}
    ref={ref}
    {...rest}
    onClick={(event) => {
      if (
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return
      }

      event.preventDefault()

      if (onClick) {
        const result = onClick(event)
        if (typeof result !== 'boolean' || result) {
          navigate(to)
        }
      } else {
        navigate(to)
      }
    }}
  />
))

interface NavLinkProps {
  to: string
  activeClassName: string
  activeMatchParams?: FlattenSearchParams
  matchSubRoutes?: boolean
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const NavLink = forwardRef<
  HTMLAnchorElement,
  NavLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(
  (
    {
      to,
      activeClassName,
      activeMatchParams,
      matchSubRoutes,
      className,
      onClick,
      ...rest
    },
    ref
  ) => {
    // Separate pathname and search parameters, USVString expected
    const [pathname, queryString] = to.split('?')
    const searchParams = activeMatchParams || flattenSearchParams(queryString)
    const matchInfo = useMatch(pathname, {
      searchParams,
      matchSubRoutes,
    })
    const theClassName = [className, matchInfo.match && activeClassName]
      .filter(Boolean)
      .join(' ')

    return (
      <a
        href={to}
        ref={ref}
        className={theClassName}
        {...rest}
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          ) {
            return
          }

          event.preventDefault()

          if (onClick) {
            const result = onClick(event)
            if (typeof result !== 'boolean' || result) {
              navigate(to)
            }
          } else {
            navigate(to)
          }
        }}
      />
    )
  }
)

interface RedirectProps {
  /** The path to redirect to */
  to: string
  options?: NavigateOptions
}

/**
 * A declarative way to redirect to a route name
 */
const Redirect = ({ to, options }: RedirectProps) => {
  useEffect(() => navigate(to, options), [to, options])
  return null
}

export { Link, NavLink, useMatch, Redirect }
