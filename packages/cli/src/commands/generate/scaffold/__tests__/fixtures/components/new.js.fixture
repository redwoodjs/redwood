import { useMutation } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import PostForm from 'src/components/PostForm'

const CREATE_POST_MUTATION = gql`
  mutation CreatePostMutation($input: PostInput!) {
    createPost(input: $input) {
      id
    }
  }
`

const NewPost = () => {
  const [createPost, { loading, error }] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: () => {
      navigate(routes.posts())
    },
  })

  const onSave = (input) => {
    createPost({ variables: { input } })
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <header className="bg-gray-300 text-gray-700 py-3 px-4">
        <h2 className="text-sm font-semibold">New Post</h2>
      </header>
      <div className="bg-gray-100 p-4">
        <PostForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewPost
