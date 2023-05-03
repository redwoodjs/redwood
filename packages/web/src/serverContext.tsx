import React from 'react'

const ServerContext = React.createContext({})

export const {
  Provider: ServerContextProvider,
  Consumer: ServerContextConsumer,
} = ServerContext

export const useServerData = <T,>() => {
  return React.useContext(ServerContext) as T
}
