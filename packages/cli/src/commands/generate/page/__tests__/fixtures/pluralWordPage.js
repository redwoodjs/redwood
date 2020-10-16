import { Link, routes } from '@redwoodjs/router'

const CatsPage = () => {
  return (
    <>
      <h1>CatsPage</h1>
      <p>
        Find me in <code>./web/src/pages/CatsPage/CatsPage.js</code>
      </p>
      <p>
        My default route is named <code>cats</code>, link to me with `
        <Link to={routes.cats()}>Cats</Link>`
      </p>
    </>
  )
}

export default CatsPage
