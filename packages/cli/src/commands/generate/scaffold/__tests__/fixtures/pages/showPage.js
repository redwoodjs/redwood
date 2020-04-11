import PostsLayout from 'src/layouts/PostsLayout'
import PostCell from 'src/components/PostCell'

const PostPage = ({ id }) => {
  return (
    <PostsLayout>
      <PostCell id={id} />
    </PostsLayout>
  )
}

export default PostPage
