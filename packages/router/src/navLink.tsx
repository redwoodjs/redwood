'use client'

import { forwardRef } from 'react'

import { Link } from './link'
import type { LinkProps } from './link'
import { useMatch } from './useMatch'
import { flattenSearchParams } from './util'
import type { FlattenSearchParams } from './util'

interface NavLinkProps extends LinkProps {
  activeClassName: string
  activeMatchParams?: FlattenSearchParams
  matchSubPaths?: boolean
}

export const NavLink = forwardRef<
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
    ref,
  ) => {
    // Separate pathname and search parameters, USVString expected
    const [pathname, queryString] = to.split('?')
    const searchParams = activeMatchParams || flattenSearchParams(queryString)
    const matchInfo = useMatch(pathname, {
      searchParams,
      matchSubPaths,
    })

    return (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={matchInfo.match ? activeClassName : className}
        {...rest}
      />
    )
  },
)
