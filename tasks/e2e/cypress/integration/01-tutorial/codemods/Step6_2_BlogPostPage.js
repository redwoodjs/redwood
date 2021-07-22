export default `
// web/src/pages/BlogPostPage/BlogPostPage.js

import BlogPostCell from 'src/components/BlogPostCell'

const BlogPostPage = ({ id }) => {
  return (
      <BlogPostCell id={id} />
  )
}

export default BlogPostPage
`
