import { FindBlogPostQuery } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'

import Author from 'src/components/Author'

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
              }).format(new Date(blogPost.createdAt))}{' '}
              - By: <Author author={blogPost.author} />
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              <Link
                className="hover:text-blue-600"
                to={routes.blogPost({ id: blogPost.id })}
              >
                {blogPost.title}
              </Link>
            </h2>
          </header>
          <div className="mb-4 mt-2 font-light text-gray-900">
            {blogPost.body}
          </div>
        </>
      )}
    </article>
  )
}

export default BlogPost
