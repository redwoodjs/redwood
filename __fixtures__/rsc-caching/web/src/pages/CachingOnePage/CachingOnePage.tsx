import { Link } from '@redwoodjs/router/Link'
import { namedRoutes as routes } from '@redwoodjs/router/namedRoutes'
import { Metadata } from '@redwoodjs/web/Metadata'

const CachingOnePage = () => {
  return (
    <>
      <Metadata title="CachingOne" description="CachingOne page" />

      <h1>CachingOnePage</h1>
      <p>
        Find me in{' '}
        <code>./web/src/pages/CachingOnePage/CachingOnePage.tsx</code>
      </p>
      {/*
        My default route is named <code>cachingOne</code>, link to me with `
        <Link to={routes.cachingOne()}>CachingOne</Link>`
      */}
    </>
  )
}

export default CachingOnePage
