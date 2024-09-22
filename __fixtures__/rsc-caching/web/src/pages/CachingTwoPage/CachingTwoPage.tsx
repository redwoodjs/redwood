import { Link } from '@redwoodjs/router/Link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { Metadata } from '@redwoodjs/web/Metadata'

const CachingTwoPage = () => {
  return (
    <>
      <Metadata title="CachingTwo" description="CachingTwo page" />

      <h1>CachingTwoPage</h1>
      <p>
        Find me in{' '}
        <code>./web/src/pages/CachingTwoPage/CachingTwoPage.tsx</code>
      </p>
      {/*
        My default route is named <code>cachingTwo</code>, link to me with `
        <Link to={routes.cachingTwo()}>CachingTwo</Link>`
      */}
    </>
  )
}

export default CachingTwoPage
