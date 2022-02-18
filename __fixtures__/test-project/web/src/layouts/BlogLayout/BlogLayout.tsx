type BlogLayoutProps = {
  children?: React.ReactNode
}

import { Link, routes } from "@redwoodjs/router";

const BlogLayout = ({ children }: BlogLayoutProps) => {
  return <>
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
        </ul>
      </nav>
    </header>
    <main className="max-w-4xl mx-auto p-12 bg-white shadow-lg rounded-b mt-3">
      {children}
    </main>
  </>;
}

export default BlogLayout
