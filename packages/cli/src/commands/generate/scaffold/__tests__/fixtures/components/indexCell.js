import { Link, routes } from '@redwoodjs/router'

import Posts from 'src/components/Posts'

export const QUERY = gql`
  query POSTS {
    posts {
      id
      title
      slug
      author
      body
      image
      isPinned
      postedAt
    }
  }
`

export const beforeQuery = (props) => {
  return { variables: props, fetchPolicy: 'cache-and-network' }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      {'No posts yet. '}
      <Link
        to={routes.newPost()}
        className="rw-link"
      >
        {'Create one?'}
      </Link>
    </div>
  )
}

export const Success = ({ posts }) => {
  return <Posts posts={posts} />
}
