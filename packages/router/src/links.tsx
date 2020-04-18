import * as React from 'react'

import { navigate, matchPath, LocationContext } from './internal'

/**
 * Returns true if the URL for the given "route" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
const useMatch = (route) => {
  const location = React.useContext(LocationContext)
  const matchInfo = matchPath(route, location.pathname)

  return matchInfo
}

export interface LinkProps {
  to: string
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, ...rest }, ref) => (
    <a
      href={to}
      ref={ref}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
      }}
    />
  )
)

export interface NavLinkProps {
  to: string
  className?: string | null
  activeClassName?: string | null
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, activeClassName, ...rest }, ref) => {
    const matchInfo = useMatch(to)
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
          event.preventDefault()
          navigate(to)
        }}
      />
    )
  }
)

export { Link, NavLink, useMatch }
