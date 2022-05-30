import type { FindWaterfallBlogPostQuery, FindWaterfallBlogPostQueryVariables } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import AuthorCell from "src/components/AuthorCell";

export const QUERY = gql`
  query FindWaterfallBlogPostQuery($id: Int!) {
    waterfallBlogPost: post(id: $id) {
      id
      title
      body
      authorId
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindWaterfallBlogPostQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error.message}</div>
)

export const Success = (
  {
    waterfallBlogPost,
  }: CellSuccessProps<FindWaterfallBlogPostQuery, FindWaterfallBlogPostQueryVariables>
) => 
<article>
{waterfallBlogPost && (
  <>
    <header className="mt-4">
      <p className="text-sm">
        {new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(waterfallBlogPost.createdAt))} - By:{' '}
        <AuthorCell id={waterfallBlogPost.authorId} />
      </p>
      <h2 className="text-xl mt-2 font-semibold">
        {waterfallBlogPost.title}
      </h2>
    </header>
    <div className="mt-2 mb-4 text-gray-900 font-light">
      {waterfallBlogPost.body}
    </div>
  </>
)}
</article>

