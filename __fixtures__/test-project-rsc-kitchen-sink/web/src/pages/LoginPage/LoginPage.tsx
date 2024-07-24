import { Link } from '@redwoodjs/router/Link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { Metadata } from '@redwoodjs/web/dist/components/Metadata'
// import { Toaster } from '@redwoodjs/web/toast'

import { LoginForm } from './LoginForm'

const LoginPage = () => {
  return (
    <>
      <Metadata title="Login" />

      <main className="rw-main">
        {/* TODO (RSC): Make Toaster work with RSC */}
        {/* <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} /> */}
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">Login</h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <LoginForm />
              </div>
            </div>
          </div>
          <div className="rw-login-link">
            <span>Don&apos;t have an account?</span>{' '}
            <Link to={routes.signup()} className="rw-link">
              Sign up!
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default LoginPage
