import { useContext, useMemo } from 'react'

import { createNamedContext } from './util'

export interface PageLoadingContextInterface {
  loading: boolean
}

const PageLoadingContext =
  createNamedContext<PageLoadingContextInterface>('PageLoading')

interface Props {
  value: PageLoadingContextInterface
  children: React.ReactNode
}

export const PageLoadingContextProvider: React.FC<Props> = ({
  value,
  children,
}) => {
  const memoValue = useMemo(() => ({ loading: value.loading }), [value.loading])

  return (
    <PageLoadingContext.Provider value={memoValue}>
      {children}
    </PageLoadingContext.Provider>
  )
}

export const usePageLoadingContext = () => {
  const pageLoadingContext = useContext(PageLoadingContext)

  if (!pageLoadingContext) {
    throw new Error(
      'usePageLoadingContext must be used within a PageLoadingContext provider'
    )
  }

  return pageLoadingContext
}
