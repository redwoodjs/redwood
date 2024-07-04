import { Link } from '@redwoodjs/router/dist/link'
import { namedRoutes as routes } from '@redwoodjs/router/dist/namedRoutes'
import { NavLink } from '@redwoodjs/router/dist/navLink'
import { getAuthState, getLocation } from '@redwoodjs/server-store'

import ReadFileServerCell from 'src/components/ReadFileServerCell'

import { AuthStatus } from './AuthStatus'

import './NavigationLayout.css'

type NavigationLayoutProps = {
  children?: React.ReactNode
  rnd?: number
}

const NavigationLayout = ({ children, rnd }: NavigationLayoutProps) => {
  const { pathname } = getLocation()
  const { isAuthenticated } = getAuthState()

  const isAuthRoute =
    pathname === routes.login() ||
    pathname === routes.signup() ||
    pathname === routes.forgotPassword() ||
    pathname === routes.resetPassword() ||
    pathname === routes.profile()

  return (
    <div className="navigation-layout">
      <nav>
        <ul>
          <li>
            <Link to={routes.home()}>Home</Link>
          </li>
          <li>
            <Link to={routes.about()}>About</Link>
          </li>
          <li>
            <Link to={routes.userExamples()}>User Examples</Link>
          </li>
          <li>
            <Link to={routes.emptyUsers()}>Empty Users</Link>
          </li>
          <li>
            <Link to={routes.multiCell()}>Multi Cell</Link>
          </li>
          <li>
            <NavLink
              to={isAuthenticated ? routes.profile() : routes.login()}
              activeClassName="active"
              matchSubPaths
            >
              Auth
              <AuthStatus initialIsAuthenticated={isAuthenticated} />
            </NavLink>
          </li>
        </ul>
      </nav>
      {!isAuthRoute && (
        <>
          <div id="rnd">{Math.round(rnd * 100)}</div>
          <ReadFileServerCell />
          <p>Layout end</p>
          <hr />
        </>
      )}
      <main>{children}</main>
    </div>
  )
}

export default NavigationLayout
