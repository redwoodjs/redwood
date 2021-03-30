import React, { useContext } from 'react'

import { createNamedContext, matchPath, parseSearch } from './internal'
import { useLocation } from './location'
import { useRouterState } from './router-context'

export interface ParamsContextProps {
  params: Record<string, string>
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

export const ParamsProvider: React.FC = ({ children }) => {
  const { routes, paramTypes } = useRouterState()
  const location = useLocation()

  let searchParams = parseSearch(location.search)

  for (const route of routes) {
    if (route.path) {
      const { match, params: pathParams } = matchPath(
        route.path,
        location.pathname,
        paramTypes
      )

      if (match) {
        params = {
          ...searchParams,
          ...pathParams,
        }
      }
    }
  }

  return (
    <ParamsContext.Provider value={{ params }}>
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
