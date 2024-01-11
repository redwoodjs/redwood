import { forwardRef, useEffect } from 'react'

import type { NavigateOptions } from './history'
import { useNavigation } from './NavigationContext'
import { useMatch } from './useMatch'
import type { FlattenSearchParams } from './util'
import { flattenSearchParams } from './util'

interface LinkProps {
  to: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const Link = forwardRef<
  HTMLAnchorElement,
  LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ to, onClick, ...rest }, ref) => {
  const { navigate } = useNavigation()
  return (
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
  )
})

interface NavLinkProps {
  to: string
  activeClassName: string
  activeMatchParams?: FlattenSearchParams
  matchSubPaths?: boolean
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
      matchSubPaths,
      className,
      onClick,
      ...rest
    },
    ref
  ) => {
    // Separate pathname and search parameters, USVString expected
    const { navigate } = useNavigation()
    const [pathname, queryString] = to.split('?')
    const searchParams = activeMatchParams || flattenSearchParams(queryString)
    const matchInfo = useMatch(pathname, {
      searchParams,
      matchSubPaths,
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
  const { navigate } = useNavigation()
  useEffect(() => {
    navigate(to, options)
  }, [to, options, navigate])

  return null
}

export { Link, NavLink, Redirect }
