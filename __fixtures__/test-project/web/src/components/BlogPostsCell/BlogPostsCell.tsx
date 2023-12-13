import type { BlogPostsQuery, BlogPostsQueryVariables } from 'types/graphql'

import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import BlogPost from 'src/components/BlogPost'

export const QUERY: TypedDocumentNode<
  BlogPostsQuery,
  BlogPostsQueryVariables
> = gql`
  query BlogPostsQuery {
    blogPosts: posts {
      id
      title
      body
      author {
        email
        fullName
      }
      createdAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({ blogPosts }: CellSuccessProps<BlogPostsQuery>) => (
  <div className="divide-grey-700 divide-y">
    {blogPosts.map((post) => (
      <BlogPost key={post.id} blogPost={post} />
    ))}
  </div>
)
