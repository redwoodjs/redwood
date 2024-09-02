import BlogPostsNavCell from 'src/components/BlogPostsNavCell/BlogPostsNavCell'

import './BlogLayout.css'

type BlogLayoutProps = {
  children?: React.ReactNode
}

const BlogLayout = ({ children }: BlogLayoutProps) => {
  return (
    <div className="blog-layout">
      <nav className="blog-posts-nav">
        <BlogPostsNavCell />
      </nav>
      <section>{children}</section>
    </div>
  )
}

export default BlogLayout
