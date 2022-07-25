import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

type BlogPostPageProps = {
  id: number
}

import BlogPostCell from 'src/components/BlogPostCell'

const BlogPostPage = ({ id }: BlogPostPageProps) => <BlogPostCell id={id} />

export default BlogPostPage
