import { useContext, forwardRef } from 'react'

import { LocationContext, navigate } from './internal'

interface LinkProps extends React.HTMLAttributes<HTMLAnchorElement>{
  to: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...rest }, ref) => (
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

interface NavLinkProps extends React.HTMLAttributes<HTMLAnchorElement>{
  to: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, activeClassName, ...rest }, ref) => {
    const context = useContext(LocationContext)
    const theClassName = to === context?.pathname ? activeClassName : className
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

export { Link, NavLink }

