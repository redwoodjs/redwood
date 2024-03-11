'use client'

import { forwardRef } from 'react'

import { Link, type LinkProps } from './link'
import { useMatch } from './useMatch'
import type { FlattenSearchParams } from './util'
import { flattenSearchParams } from './util'

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
    const theClassName = [className, matchInfo.match && activeClassName]
      .filter(Boolean)
      .join(' ')

    return (
      <Link
        ref={ref}
        to={to}
        onClick={onClick}
        className={theClassName}
        {...rest}
      />
    )
  },
)
