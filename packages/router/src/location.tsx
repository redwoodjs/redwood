import React, { ReactNode, useContext, useEffect, useState } from 'react'

import { createNamedContext, gHistory } from './internal'

const LocationContext = createNamedContext<LocationContext>('Location')

interface LocationContext {
  pathname: string
  search: string
  hash?: string
}

interface LocationProviderProps {
  location?: LocationContext
  children?: ReactNode
}

function LocationProvider(props: LocationProviderProps) {
  const { pathname, search, hash } = props.location ?? window.location
  const { children } = props
  const [context, setContext] = useState<LocationContext>({
    pathname,
    search,
    hash,
  })

  useEffect(() => {
    const historyId = gHistory.listen(() => {
      setContext({ pathname, search, hash })
    })

    return () => gHistory.remove(historyId)
  })
  return (
    <LocationContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children}
    </LocationContext.Provider>
  )
}

function Location({
  children,
}: {
  children: (context: LocationContext) => React.ReactElement
}) {
  const context = useContext(LocationContext)
  return context ? (
    children(context)
  ) : (
    <LocationProvider>{children}</LocationProvider>
  )
}

/** A hook that returns the current location */
const useLocation = () => {
  const location = useContext(LocationContext)

  if (!location)
    throw Error('`useLocation` can only be used inside a `LocationProvider`')

  return location
}

export { Location, LocationProvider, LocationContext, useLocation }
