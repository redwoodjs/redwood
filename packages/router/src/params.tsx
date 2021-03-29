import React, { useState, useContext } from 'react'

import { createNamedContext } from './internal'

export interface ParamsContextProps {
  params: Record<string, string> | undefined
  setParams: (newParams: Record<string, string> | undefined) => void
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

export const ParamsProvider: React.FC = ({ children }) => {
  // TODO: Populate the params.
  const [params, setParams] = useState<Record<string, string> | undefined>()

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

  return paramsContext.params || {}
}
