import { useState } from 'react'

const PageLoader = ({ loadPage, params }) => {
  const [cache, setCache] = useState({})
  const [pageName, setPageName] = useState(null)

  console.log('PageLoader render for', loadPage.name)
  console.log('Cache', cache)

  const loadedPage = cache[loadPage.name]
  if (loadedPage) {
    console.log('Found loaded page', loadedPage.name)
    console.log('Compare', [pageName, loadedPage.name])
    if (pageName != loadedPage.name) {
      setPageName(loadedPage.name)
    }
  } else {
    loadPage().then((module) => {
      console.log('loaded page')

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
