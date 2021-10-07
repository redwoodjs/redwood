/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react'

// @ts-ignore
import { useLocation } from '@redwoodjs/router/dist/location'
// @ts-ignore
import { createNamedContext, parseSearch } from '@redwoodjs/router/dist/util'

export interface ParamsContextProps {
  params: Record<string, string>
}

export const ParamsContext = createNamedContext<ParamsContextProps>('Params')

interface Props {
  path?: string
}

export const MockParamsProvider: React.FC<Props> = ({ children }) => {
  const location = useLocation()

  const searchParams = parseSearch(location.search)

  return (
    <ParamsContext.Provider
      value={{
        params: {
          ...searchParams,
        },
      }}
    >
      {children}
    </ParamsContext.Provider>
  )
}
