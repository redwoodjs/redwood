import { useContext } from 'react'

import { createNamedContext } from './util'

export interface PageLoadingContextInterface {
  loading: boolean
}

const PageLoadingContext =
  createNamedContext<PageLoadingContextInterface>('PageLoading')

export const PageLoadingContextProvider = PageLoadingContext.Provider

export const usePageLoadingContext = () => {
  const pageLoadingContext = useContext(PageLoadingContext)

  if (!pageLoadingContext) {
    throw new Error(
      'usePageLoadingContext must be used within a PageLoadingContext provider'
    )
  }

  return pageLoadingContext
}
