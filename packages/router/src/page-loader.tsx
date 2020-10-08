import React, { useContext, useEffect, useMemo, useState } from 'react'

import { createNamedContext, Spec } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

/**
 * Because lazily-loaded pages can take a non-negligible amount of time to
 * load (depending on bundle size and network connection),
 * you may want to show a loading indicator
 * to signal to the user that something is happening after they click a link.
 * RR makes this really easy with `usePageLoadingContext`:
 *
 * @example
 * ```js
 * // SomeLayout.js
 *
 * import { usePageLoadingContext } from '@redwoodjs/router'
 *
 * const SomeLayout = (props) => {
 * const { loading } = usePageLoadingContext()
 * return (
 *   <div>
 *     {loading && <div>Loading...</div>}
 *     <main>{props.children}</main>
 *   </div>
 *   )
 * }
 * ```
 */
export const usePageLoadingContext = () => useContext(PageLoadingContext)

type PageLoaderProps<P = unknown> = {
  spec: Spec<P>
  delay?: number
  params?: P //! not safe optional, only for `props: {}` case. It can be typed with conditionals
}

// TODO test: changed props didn't appear in loaded page (fixed)
// TODO test: failed loading didn't reset timeout (fixed)

export function PageLoader<P>(props: PageLoaderProps<P>) {
  const { params = {} as P, spec, delay } = props
  const [previousPageProps, setPreviousPageProps] = useState(params)
  const [Page, setPage] = useState<React.ComponentType<P> | undefined>(
    undefined
  )
  const [pageName, setPageName] = useState('')
  const [slowModuleImport, setSlowModuleImport] = useState(false)

  const isNewPage = pageName !== name

  useEffect(() => {
    const { loader, name } = spec
    if (!isNewPage) return

    // Update the context if importing the page is taking longer
    // than `delay`.
    // Consumers of the context can show a loading indicator
    // to signal to the user that something is happening.
    const loadingTimeout = setTimeout(() => setSlowModuleImport(true), delay)

    // Wait to download and parse the page.
    loader()
      .then((loadedModule) => {
        setPageName(name)
        setPage(() => loadedModule.default)
        setSlowModuleImport(false)
        setPreviousPageProps(params)
      })
      .finally(() => clearTimeout(loadingTimeout))
  }, [delay, isNewPage, params, spec])

  const loadingContextValue = useMemo(() => ({ loading: slowModuleImport }), [
    slowModuleImport,
  ])

  if (Page) {
    return (
      <PageLoadingContext.Provider value={loadingContextValue}>
        <Page {...(isNewPage ? previousPageProps : params)} />
      </PageLoadingContext.Provider>
    )
  } else {
    return null
  }
}
