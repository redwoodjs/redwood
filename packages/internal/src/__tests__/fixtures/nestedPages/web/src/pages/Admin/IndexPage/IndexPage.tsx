import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const IndexPage = () => {
  return (
    <>
      <MetaTags title="AdminIndex" description="AdminIndex page" />

      <h1>AdminIndexPage</h1>
      <p>
        Find me in <code>./web/src/pages/AdminIndexPage/AdminIndexPage.tsx</code>
      </p>
      <p>
        My default route is named <code>adminIndex</code>, link to me with `
        <Link to={routes.adminIndex()}>AdminIndex</Link>`
      </p>
    </>
  )
}

export default IndexPage
