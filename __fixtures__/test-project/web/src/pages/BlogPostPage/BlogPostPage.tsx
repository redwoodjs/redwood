import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

type BlogPostPageProps = {
  id: number
}

import BlogPostCell from 'src/components/BlogPostCell'

const BlogPostPage = ({ id }: BlogPostPageProps) => {
  return (
    <>
      <MetaTags title={`Post ${id}`} description={`Description ${id}`} />

      <BlogPostCell id={id} />
    </>
  )
}

export default BlogPostPage
