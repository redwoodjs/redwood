import { Metadata } from '@redwoodjs/web/Metadata'

import BlogPostCell from 'src/components/BlogPostCell'

interface Props {
  slug: string
}

const BlogPostPage = ({ slug }: Props) => {
  return (
    <>
      <Metadata title="BlogPost" description="BlogPost page" />

      <BlogPostCell slug={slug} />
    </>
  )
}

export default BlogPostPage
