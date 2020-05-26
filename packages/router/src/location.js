import { useState, useEffect, useContext } from 'react'

import { createNamedContext, gHistory } from './internal'

const LocationContext = createNamedContext('Location')

const LocationProvider = ({ location = window.location, children }) => {
  const getContext = () => {
    const { pathname, search, hash } = location
    return { pathname, search, hash }
  }

  const [context, setContext] = useState(getContext())

  useEffect(() => gHistory.listen(() => setContext(getContext())), []) // eslint-disable-line

  return (
    <LocationContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children || null}
    </LocationContext.Provider>
  )
}

const Location = ({ children }) => {
  const context = useContext(LocationContext)

  return context ? (
    children(context)
  ) : (
    <LocationProvider>{children}</LocationProvider>
  )
}

export { Location, LocationProvider, LocationContext }
