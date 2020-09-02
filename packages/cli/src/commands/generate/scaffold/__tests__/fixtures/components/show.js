import { useMutation, useFlash } from '@redwoodjs/web'
import { Link, routes, navigate } from '@redwoodjs/router'

const DELETE_POST_MUTATION = gql`
  mutation DeletePostMutation($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`

const jsonDisplay = (obj) => {
  return (
    <pre>
      <code>{JSON.stringify(obj, null, 2)}</code>
    </pre>
  )
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

const Post = ({ post }) => {
  const { addMessage } = useFlash()
  const [deletePost] = useMutation(DELETE_POST_MUTATION, {
    onCompleted: () => {
      navigate(routes.posts())
      addMessage('Post deleted.', { classes: 'rw-flash-success' })
    },
  })

  const onDeleteClick = (id) => {
    if (confirm('Are you sure you want to delete post ' + id + '?')) {
      deletePost({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            Post {post.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{post.id}</td>
            </tr>
            <tr>
              <th>Title</th>
              <td>{post.title}</td>
            </tr>
            <tr>
              <th>Slug</th>
              <td>{post.slug}</td>
            </tr>
            <tr>
              <th>Author</th>
              <td>{post.author}</td>
            </tr>
            <tr>
              <th>Body</th>
              <td>{post.body}</td>
            </tr>
            <tr>
              <th>Image</th>
              <td>{post.image}</td>
            </tr>
            <tr>
              <th>Is pinned</th>
              <td>{checkboxInputTag(post.isPinned)}</td>
            </tr>
            <tr>
              <th>Read time</th>
              <td>{post.readTime}</td>
            </tr>
            <tr>
              <th>Rating</th>
              <td>{post.rating}</td>
            </tr>
            <tr>
              <th>Posted at</th>
              <td>{timeTag(post.postedAt)}</td>
            </tr>
            <tr>
              <th>Metadata</th>
              <td>{jsonDisplay(post.metadata)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <Link
          to={routes.editPost({ id: post.id })}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <a
          href="#"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(post.id)}
        >
          Delete
        </a>
      </nav>
    </>
  )
}

export default Post
