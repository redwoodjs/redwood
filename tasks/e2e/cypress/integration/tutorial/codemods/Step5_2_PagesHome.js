export default `
// web/src/pages/HomePage/HomePage.js

import BlogLayout from 'src/layouts/BlogLayout'
import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <BlogLayout>
      <BlogPostsCell />
    </BlogLayout>
  )
}

export default HomePage
`