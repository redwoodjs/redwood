import { useState, useRef, useEffect } from 'react'

import { createNamedContext } from './internal'

const PageLoadingContext = createNamedContext('PageLoading')

const PageLoader = ({ spec, delay, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)
  const [loading, setLoading] = useState(false)
  const loadingTimeout = useRef()

  const { loader, name } = spec
  useEffect(() => {
    const loadedPage = cache[name]
    if (loading) {
      // noop
    } else if (loadedPage) {
      //
      if (pageName != loadedPage.name) {
        setPageName(loadedPage.name)
      }
    } else {
      loadingTimeout.current = setTimeout(() => setLoading(true), delay)
      loader().then((module) => {
        // Clear the timeout once the module has been imported.
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current)
        }
        setCache({ [name]: module.default })
        setPageName(name)
        setLoading(false)
      })
    }
  }, [cache, delay, loader, loading, name, pageName])

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
