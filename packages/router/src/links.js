import { useContext } from 'react'

import { LocationContext, navigate } from './internal'

const Link = ({ to, ...rest }) => (
  <a
    href={to}
    {...rest}
    onClick={(event) => {
      event.preventDefault()
      navigate(to)
    }}
  />
)

const NavLink = ({ to, className, activeClassName, ...rest }) => {
  const context = useContext(LocationContext)
  const theClassName = to === context.pathname ? activeClassName : className
  return (
    <a
      href={to}
      className={theClassName}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
      }}
    />
  )
}

export { Link, NavLink }
