import { useState } from 'react'

import { createNamedContext } from './internal'

const PageLoadingContext = createNamedContext('PageLoading')

const PageLoader = ({ loadPage, delay, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)
  const [loading, setLoading] = useState(false)

  let loadingTimeout

  console.log(pageName, loading, cache)

  const loadedPage = cache[loadPage.name]
  if (loading) {
    // noop
  } else if (loadedPage) {
    if (pageName != loadedPage.name) {
      setPageName(loadedPage.name)
    }
  } else {
    loadingTimeout = setTimeout(() => setLoading(true), delay)
    loadPage().then((module) => {
      console.log('Loaded', loadPage.name)
      cache[loadPage.name] = module.default
      setCache(cache)
      setPageName(loadPage.name)
      setLoading(false)
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
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
