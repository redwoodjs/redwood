import React from 'react'

// ?? Not sure when to use @redwoodjs/router vs dist
import { useLocation } from '@redwoodjs/router/dist/location'
import { ParamsContext } from '@redwoodjs/router/dist/params'
import { parseSearch } from '@redwoodjs/router/dist/util'
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
