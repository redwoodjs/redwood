import { forwardRef, useContext } from 'react'

import { navigate, matchPath, LocationContext } from './internal'

/**
 * Returns true if the URL for the given "route" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
const useMatch = (route) => {
  const location = useContext(LocationContext)
  const matchInfo = matchPath(route, location.pathname)

  return matchInfo
}

const Link = forwardRef(({ to, ...rest }, ref) => (
  <a
    href={to}
    ref={ref}
    {...rest}
    onClick={(event) => {
      event.preventDefault()
      navigate(to)
    }}
  />
))

const NavLink = forwardRef(
  ({ to, className, activeClassName, ...rest }, ref) => {
    const matchInfo = useMatch(to)
    const theClassName = matchInfo.match
      ? `${className || ''} ${activeClassName}`
      : className

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
