import type {
  FindBlogPostQuery,
  FindBlogPostQueryVariables,
} from 'types/graphql'

import type {
  CellFailureProps,
  CellLoadingProps,
  CellSuccessProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import BlogPost from 'src/components/BlogPost'

export const QUERY: TypedDocumentNode<
  FindBlogPostQuery,
  FindBlogPostQueryVariables
> = gql`
  query FindBlogPostQuery($id: Int!) {
    blogPost: post(id: $id) {
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
  CellLoadingProps<FindBlogPostQueryVariables>
> = () => <div>Loading...</div>

export const Empty: React.FC<
  CellSuccessProps<FindBlogPostQueryVariables>
> = () => <div>Empty</div>

export const Failure: React.FC<
  CellFailureProps<FindBlogPostQueryVariables>
> = ({ error }) => <div style={{ color: 'red' }}>Error: {error?.message}</div>

export const Success: React.FC<
  CellSuccessProps<FindBlogPostQuery, FindBlogPostQueryVariables>
> = ({ blogPost }) => <BlogPost blogPost={blogPost} />
