import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { NavLink } from '@redwoodjs/router/NavLink'

import './AuthLayout.css'

type AuthLayoutProps = {
  children?: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <nav>
        <ul>
          <li>
            <NavLink to={routes.login()} activeClassName="active">
              Login
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.signup()} activeClassName="active">
              Signup
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.forgotPassword()} activeClassName="active">
              Forgot Password
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.resetPassword()} activeClassName="active">
              Reset Password
            </NavLink>
          </li>
          <li>
            <NavLink to={routes.profile()} activeClassName="active">
              Profile
            </NavLink>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}

export default AuthLayout
