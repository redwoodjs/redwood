import { Link, routes } from '@redwoodjs/router'

const CatsPage = () => {
  return (
    <>
      <h1>CatsPage</h1>
      <p>
        Find me in <tt>./web/src/pages/CatsPage/CatsPage.js</tt>
      </p>
      <p>
        My default route is named <tt>cats</tt>, link to me with `
        <Link to={routes.cats()}>Cats</Link>`
      </p>
    </>
  )
}

export default CatsPage
