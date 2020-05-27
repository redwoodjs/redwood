import { useMutation } from '@redwoodjs/web'
import { Link, routes, navigate } from '@redwoodjs/router'

const DELETE_POST_MUTATION = gql`
  mutation DeletePostMutation($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`

const Post = ({ post }) => {
  const [deletePost] = useMutation(DELETE_POST_MUTATION, {
    onCompleted: () => {
      navigate(routes.posts())
      location.reload()
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
          <h2 className="rw-heading rw-heading-secondary">Post {post.id} Detail</h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <td>id</td>
              <td>{post.id}</td>
            </tr><tr>
              <td>title</td>
              <td>{post.title}</td>
            </tr><tr>
              <td>slug</td>
              <td>{post.slug}</td>
            </tr><tr>
              <td>author</td>
              <td>{post.author}</td>
            </tr><tr>
              <td>body</td>
              <td>{post.body}</td>
            </tr><tr>
              <td>image</td>
              <td>{post.image}</td>
            </tr><tr>
              <td>postedAt</td>
              <td>{post.postedAt}</td>
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
