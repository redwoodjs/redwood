import React, { useState, useContext } from 'react'

import { useLocation } from 'src/location'
import { useRouterState } from 'src/router-context'

import { createNamedContext, matchPath, parseSearch } from './internal'

export interface ParamsContextProps {
  params: Record<string, string>
  setParams: (newParams: Record<string, string>) => void
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

export const ParamsProvider: React.FC = ({ children }) => {
  const { routes, paramTypes } = useRouterState()
  const location = useLocation()

  let initialParams = parseSearch(location.search)

  for (const route of routes) {
    if (route.path) {
      const { match, params } = matchPath(
        route.path,
        location.pathname,
        paramTypes
      )

      if (match) {
        initialParams = {
          ...initialParams,
          ...params,
        }
      }
    }
  }

  const [params, setParams] = useState<Record<string, string>>(initialParams)

  return (
    <ParamsContext.Provider value={{ params, setParams }}>
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
