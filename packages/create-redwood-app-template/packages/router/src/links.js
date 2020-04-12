import { useContext, forwardRef } from 'react'

import { LocationContext, navigate } from './internal'

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
    const context = useContext(LocationContext)
    const theClassName = to === context.pathname ? activeClassName : className
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
