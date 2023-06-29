// TODO (STREAMING) is this even used anymore?
import React from 'react'

const ServerContext = React.createContext({})

export const {
  Provider: ServerContextProvider,
  Consumer: ServerContextConsumer,
} = ServerContext
