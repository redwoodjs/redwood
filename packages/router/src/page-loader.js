import { useState, useRef } from 'react'

import { createNamedContext } from './internal'

const PageLoadingContext = createNamedContext('PageLoading')

const PageLoader = ({ spec, delay, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)
  const [loading, setLoading] = useState(false)
  const loadingTimeout = useRef()

  const { loader, name } = spec

  const loadedPage = cache[name]
  if (loading) {
    // noop
  } else if (loadedPage) {
    if (pageName != loadedPage.name) {
      setPageName(loadedPage.name)
    }
  } else {
    loadingTimeout.current = setTimeout(() => setLoading(true), delay)
    loader().then((module) => {
      cache[name] = module.default
      setCache(cache)
      setPageName(name)
      setLoading(false)
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current)
      }
    })
  }

  let Page = cache[pageName]
  if (Page) {
    return (
      <PageLoadingContext.Provider value={{ loading }}>
        <Page {...params} />
      </PageLoadingContext.Provider>
    )
  } else {
    return null
  }
}

export { PageLoader, PageLoadingContext }
