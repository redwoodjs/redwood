import { forwardRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import { navigate, matchPath, useLocation } from './internal'

/**
 * Returns true if the URL for the given "route" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
const useMatch = (route) => {
  const location = useLocation()
  const matchInfo = matchPath(route, location.pathname)

  return matchInfo
}

const Link = forwardRef(({ to, ...rest }, ref) => (
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
      navigate(to)
    }}
  />
))

const NavLink = forwardRef(
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
          navigate(to)
        }}
      />
    )
  }
)

/**
 * A declarative way to redirect to a route name
 */
const Redirect = ({ to }) => {
  useEffect(() => {
    navigate(to)
  }, [to])
  return null
}
Redirect.propTypes = {
  /** The name of the route to redirect to */
  to: PropTypes.string.isRequired,
}

export { Link, NavLink, useMatch, Redirect }
