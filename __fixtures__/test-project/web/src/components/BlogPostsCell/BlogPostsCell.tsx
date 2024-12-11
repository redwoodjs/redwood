import type { BlogPostsQuery, BlogPostsQueryVariables } from 'types/graphql'

import type {
  CellFailureProps,
  CellLoadingProps,
  CellSuccessProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import BlogPost from 'src/components/BlogPost'

export const QUERY: TypedDocumentNode<BlogPostsQuery, BlogPostsQueryVariables> =
  gql`
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

export const Loading: React.FC<
  CellLoadingProps<BlogPostsQueryVariables>
> = () => <div>Loading...</div>

export const Empty: React.FC<
  CellSuccessProps<BlogPostsQueryVariables>
> = () => <div>Empty</div>

export const Failure: React.FC<CellFailureProps<BlogPostsQueryVariables>> = ({
  error,
}) => <div style={{ color: 'red' }}>Error: {error?.message}</div>

export const Success: React.FC<
  CellSuccessProps<BlogPostsQuery, BlogPostsQueryVariables>
> = ({ blogPosts }) => (
  <div className="divide-grey-700 divide-y">
    {blogPosts.map((post) => (
      <BlogPost key={post.id} blogPost={post} />
    ))}
  </div>
)
