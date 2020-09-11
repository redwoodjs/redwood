import { Link, routes } from '@redwoodjs/router'

const HomePage = () => {
  return (
    <>
      <h1>HomePage</h1>
      <p>
        Find me in <tt>./web/src/pages/HomePage/HomePage.js</tt>
      </p>
      <p>
        My default route is named <tt>home</tt>, link to me with `
        <Link to={routes.home()}>Home</Link>`
      </p>
    </>
  )
}

export default HomePage
