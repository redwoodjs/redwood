import { useMutation, useFlash } from '@redwoodjs/web'
import { Link, routes } from '@redwoodjs/router'

const DELETE_POST_MUTATION = gql`
  mutation DeletePostMutation($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`

const MAX_STRING_LENGTH = 150

const truncate = (text) => {
  let output = text
  if (text && text.length > MAX_STRING_LENGTH) {
    output = output.substring(0, MAX_STRING_LENGTH) + '...'
  }
  return output
}

const jsonTruncate = (obj) => {
  return truncate(JSON.stringify(obj, null, 2))
}

const timeTag = (datetime) => {
  return (
    <time dateTime={datetime} title={datetime}>
      {new Date(datetime).toUTCString()}
    </time>
  )
}

const checkboxInputTag = (checked) => {
  return <input type="checkbox" checked={checked} disabled />
}

const PostsList = ({ posts }) => {
  const { addMessage } = useFlash()
  const [deletePost] = useMutation(DELETE_POST_MUTATION, {
    onCompleted: () => {
      addMessage('Post deleted.', { classes: 'rw-flash-success' })
    },
  })

  const onDeleteClick = (id) => {
    if (confirm('Are you sure you want to delete post ' + id + '?')) {
      deletePost({ variables: { id }, refetchQueries: ['POSTS'] })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Title</th>
            <th>Slug</th>
            <th>Author</th>
            <th>Body</th>
            <th>Image</th>
            <th>Is pinned</th>
            <th>Read time</th>
            <th>Rating</th>
            <th>Posted at</th>
            <th>Metadata</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{truncate(post.id)}</td>
              <td>{truncate(post.title)}</td>
              <td>{truncate(post.slug)}</td>
              <td>{truncate(post.author)}</td>
              <td>{truncate(post.body)}</td>
              <td>{truncate(post.image)}</td>
              <td>{checkboxInputTag(post.isPinned)}</td>
              <td>{truncate(post.readTime)}</td>
              <td>{truncate(post.rating)}</td>
              <td>{timeTag(post.postedAt)}</td>
              <td>{jsonTruncate(post.metadata)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.post({ id: post.id })}
                    title={'Show post ' + post.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.editPost({ id: post.id })}
                    title={'Edit post ' + post.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <a
                    href="#"
                    title={'Delete post ' + post.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(post.id)}
                  >
                    Delete
                  </a>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PostsList
