import React, { useState, useContext } from 'react'

import { createNamedContext } from './internal'

interface ParamsContextProps {
  params: Record<string, string> | undefined
  setParams: (newParams: Record<string, string> | undefined) => void
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

export const ParamsProvider: React.FC<{}> = ({ children }) => {
  const [params, setParams] = useState<Record<string, string> | undefined>(
    undefined
  )

  return (
    <ParamsContext.Provider value={{ params, setParams }}>
      {children}
    </ParamsContext.Provider>
  )
}

export const useParams = () => {
  const params = useContext(ParamsContext)

  if (params === undefined) {
    throw new Error('useParams must be used within a ParamsProvider')
  }

  return params
}
