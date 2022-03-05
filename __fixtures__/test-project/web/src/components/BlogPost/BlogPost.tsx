import { Link, routes } from '@redwoodjs/router'
import { FindBlogPostQuery } from 'types/graphql'

interface Props extends FindBlogPostQuery {}

const BlogPost = ({ blogPost }: Props) => {
  return (
    <article>
      {blogPost && (
        <>
          <header className="mt-4">
            <p className="text-sm">
              {new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date(blogPost.createdAt))}
            </p>
            <h2 className="text-xl mt-2 font-semibold">
              <Link
                className="hover:text-blue-600"
                to={routes.blogPost({ id: blogPost.id })}
              >
                {blogPost.title}
              </Link>
            </h2>
          </header>
          <div className="mt-2 mb-4 text-gray-900 font-light">
            {blogPost.body}
          </div>
        </>
      )}
    </article>
  )
}

export default BlogPost
