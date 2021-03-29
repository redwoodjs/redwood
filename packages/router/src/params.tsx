import React, { useState, useContext } from 'react'

import { useLocation } from 'src/location'
import type { ParamType } from 'src/util'

import { createNamedContext, matchPath, parseSearch } from './internal'

export interface ParamsContextProps {
  params: Record<string, string>
  setParams: (newParams: Record<string, string>) => void
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

interface Props {
  routePaths: string[]
  paramTypes?: Record<string, ParamType>
}

export const ParamsProvider: React.FC<Props> = ({
  children,
  routePaths,
  paramTypes,
}) => {
  const location = useLocation()

  let initialParams = parseSearch(location.search)

  for (const path of routePaths) {
    const { match, params } = matchPath(path, location.pathname, paramTypes)

    if (match) {
      initialParams = {
        ...initialParams,
        ...params,
      }

      break
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
