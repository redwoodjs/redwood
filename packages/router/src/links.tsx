import { forwardRef, useEffect } from 'react'

import { navigate, matchPath, useLocation } from './internal'

/**
 * Returns true if the URL for the given "route" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
function useMatch(route: string) {
  const location = useLocation()
  const matchInfo = matchPath(route, location.pathname)

  return matchInfo
}

interface LinkProps
  extends React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  to: string
}

/**
 * When it comes to routing, matching URLs to Pages is only half the equation.
 * The other half is generating links to your pages.
 * Redwood makes this really simple without having to hardcode URL paths.
 *
 * @example
 * ```js
 * // SomePage.js
 * import { Link, routes } from '@redwoodjs/router'
 *
 * // Given the route in the last section, this produces: <a href="/">
 * const SomePage = () => <Link to={routes.home()} />
 * ```
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, ...rest }, ref) => (
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
  )
)

interface NavLinkProps
  extends React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  to: string
  activeClassName?: string
}

/**
 * `NavLink` is a special version of `Link` that will add an `activeClassName`
 * to the rendered element when it matches the current URL.
 *
 * @example
 * ```js
 * // MainMenu.js
 * import { NavLink, routes } from '@redwoodjs/router'
 *
 * // Will render <a href="/" className="link activeLink"> when on the home page
 * const MainMenu = () =>
 *  <NavLink className="link" activeClassName="activeLink" to={routes.home()}>
 *    Home
 *  </NavLink>
 * ```
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
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
 * If you want to declaratively redirect to a different page,
 * use the `<Redirect>` component.
 * @example
 * ```js
 * // SomePage.js
 * import { Redirect, routes } from '@redwoodjs/router'
 *
 * const SomePage = () => {
 *   <Redirect to={routes.home()}/>
 * }
 * ```
 **/
const Redirect = ({ to }: { to: string }) => {
  useEffect(() => {
    navigate(to)
  }, [to])
  return null
}

export { Link, NavLink, useMatch, Redirect }
