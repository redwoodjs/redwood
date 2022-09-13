import React, { useContext } from 'react'

import { LocationContextType, useLocation } from './location'
import { useRouterState } from './router-context'
import { createNamedContext, matchPath, parseSearch } from './util'

export interface ParamsContextProps {
  params: Record<string, string>
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

interface Props {
  path?: string
  location?: LocationContextType
  children?: React.ReactNode
}

export const ParamsProvider: React.FC<Props> = ({
  path,
  location,
  children,
}) => {
  const { paramTypes } = useRouterState()
  const contextLocation = useLocation()
  const internalLocation = location || contextLocation

  let pathParams = {}
  const searchParams = parseSearch(internalLocation.search)

  if (path) {
    const { match, params } = matchPath(
      path,
      internalLocation.pathname,
      paramTypes
    )

    if (match && typeof params !== 'undefined') {
      pathParams = params
    }
  }

  return (
    <ParamsContext.Provider
      value={{
        params: {
          ...searchParams,
          ...pathParams,
        },
      }}
    >
      {children}
    </ParamsContext.Provider>
  )
}

export const useParams = () => {
  const paramsContext = useContext(ParamsContext)

  if (paramsContext === undefined) {
    throw new Error('useParams must be used within a ParamsProvider')
  }

  return paramsContext.params
}
