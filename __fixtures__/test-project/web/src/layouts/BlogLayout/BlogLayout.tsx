type BlogLayoutProps = {
  children?: React.ReactNode
}

import { Link, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const BlogLayout = ({ children }: BlogLayoutProps) => {
  const { logOut, isAuthenticated } = useAuth()

  return (
    <>
      <header className="relative flex justify-between items-center py-4 px-8 bg-blue-700 text-white">
        <h1 className="text-3xl font-semibold tracking-tight">
          <Link
            className="text-blue-400 hover:text-blue-100 transition duration-100"
            to={routes.home()}
          >
            Redwood Blog
          </Link>
        </h1>
        <nav>
          <ul className="relative flex items-center font-light">
            <li>
              <Link
                className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                to={routes.about()}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                to={routes.contact()}
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                to={routes.posts()}
              >
                Admin
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link
                  className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
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
                  className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                  to={routes.login()}
                >
                  Log In
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <main className="max-w-4xl mx-auto p-12 bg-white shadow-lg rounded-b mt-3">
        {children}
      </main>
    </>
  )
}

export default BlogLayout
