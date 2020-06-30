import { Link } from '@redwoodjs/router'

const CatsPage = () => {
  return (
    <>
      <h1>CatsPage</h1>
      <p>Find me in "./web/src/pages/CatsPage/CatsPage.js"</p>
      <p>
        My default route is named "cats", link to me with `
        <Link to="cats">routes.cats()</Link>`
      </p>
    </>
  )
}

export default CatsPage
