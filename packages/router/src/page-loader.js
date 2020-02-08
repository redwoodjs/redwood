import { useState } from 'react'

const PageLoader = ({ loadPage, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)

  const loadedPage = cache[loadPage.name]
  if (loadedPage) {
    if (pageName != loadedPage.name) {
      setPageName(loadedPage.name)
    }
  } else {
    loadPage().then((module) => {
      cache[loadPage.name] = module.default
      setCache(cache)
      setPageName(loadPage.name)
    })
  }

  let Page = cache[pageName]
  if (Page) {
    return <Page {...params} />
  } else {
    return null
  }
}

export { PageLoader }
