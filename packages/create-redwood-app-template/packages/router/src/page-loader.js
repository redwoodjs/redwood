import { useState } from 'react'

import { createNamedContext } from './internal'

const PageLoadingContext = createNamedContext('PageLoading')

const PageLoader = ({ loadPage, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)
  const [loading, setLoading] = useState(false)

  console.log(pageName, loading, cache)

  const loadedPage = cache[loadPage.name]
  if (loading) {
    // noop
  } else if (loadedPage) {
    if (pageName != loadedPage.name) {
      setPageName(loadedPage.name)
    }
  } else {
    setLoading(true)
    loadPage().then((module) => {
      console.log('Loaded', loadPage.name)
      cache[loadPage.name] = module.default
      setCache(cache)
      setPageName(loadPage.name)
      setLoading(false)
    })
  }

  let Page = cache[pageName]
  if (Page) {
    return (
      <PageLoadingContext.Provider value={loading}>
        <Page {...params} />
      </PageLoadingContext.Provider>
    )
  } else {
    return null
  }
}

export { PageLoader, PageLoadingContext }
