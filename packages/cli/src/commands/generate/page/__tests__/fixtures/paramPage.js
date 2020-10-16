import { Link, routes } from '@redwoodjs/router'

const PostPage = ({ id }) => {
  return (
    <>
      <h1>PostPage</h1>
      <p>
        Find me in <code>./web/src/pages/PostPage/PostPage.js</code>
      </p>
      <p>
        My default route is named <code>post</code>, link to me with `
        <Link to={routes.post({ id: '42' })}>Post 42</Link>`
      </p>
      <p>The parameter passed to me is {id}</p>
    </>
  )
}

export default PostPage
