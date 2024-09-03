// import { useRouteName } from '@redwoodjs/router/dist/useRouteName'
import { Link } from '@redwoodjs/router/Link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { getLocation } from '@redwoodjs/server-store'

import BlogPostsNavCell from 'src/components/BlogPostsNavCell/BlogPostsNavCell'

import './BlogLayout.css'

type BlogLayoutProps = {
  children?: React.ReactNode
}

const BlogLayout = ({ children }: BlogLayoutProps) => {
  // I wish I could do this, but I can't because this is a server component,
  // and server components can't use hooks
  // const routeName = useRouteName()

  const { pathname } = getLocation()
  const blogPostPageMatch = pathname.match(/^\/blog\/([-\w]+)$/)
  const slug = blogPostPageMatch?.[1]

  return (
    <div className="blog-layout">
      <nav className="blog-posts-nav">
        <BlogPostsNavCell />
        <hr />
        <ul>
          <li className="new-post">
            <Link to={routes.newBlogPost()}>New Blog Post</Link>
          </li>
          {slug && (
            <>
              <li>
                <Link to={routes.editBlogPost({ slug })}>Edit Blog Post</Link>
              </li>
              <li>
                <button type="button">Delete Blog Post</button>
              </li>
            </>
          )}
        </ul>
      </nav>
      <section>{children}</section>
    </div>
  )
}

export default BlogLayout
