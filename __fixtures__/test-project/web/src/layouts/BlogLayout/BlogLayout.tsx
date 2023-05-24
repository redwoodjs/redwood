type BlogLayoutProps = {
  children?: React.ReactNode
}

import { Link, routes } from '@redwoodjs/router'

import { useAuth } from 'src/auth'

const BlogLayout = ({ children }: BlogLayoutProps) => {
  const { logOut, isAuthenticated } = useAuth()

  return (
    <>
      <header className="relative flex items-center justify-between bg-blue-700 px-8 py-4 text-white">
        <h1 className="text-3xl font-semibold tracking-tight">
          <Link
            className="text-blue-400 transition duration-100 hover:text-blue-100"
            to={routes.home()}
          >
            Redwood Blog
          </Link>
        </h1>
        <nav>
          <ul className="relative flex items-center font-light">
            <li>
              <Link
                className="rounded px-4 py-2 transition duration-100 hover:bg-blue-600"
                to={routes.about()}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                className="rounded px-4 py-2 transition duration-100 hover:bg-blue-600"
                to={routes.contactUs()}
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                className="rounded px-4 py-2 transition duration-100 hover:bg-blue-600"
                to={routes.posts()}
              >
                Admin
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link
                  className="rounded px-4 py-2 transition duration-100 hover:bg-blue-600"
                  onClick={logOut}
                  to={''}
                >
                  Log Out
                </Link>
              </li>
            )}
            {!isAuthenticated && (
              <li>
                <Link
                  className="rounded px-4 py-2 transition duration-100 hover:bg-blue-600"
                  to={routes.login()}
                >
                  Log In
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <main className="mx-auto mt-3 max-w-4xl rounded-b bg-white p-12 shadow-lg">
        {children}
      </main>
    </>
  )
}

export default BlogLayout
