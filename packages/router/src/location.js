import { createNamedContext, gHistory } from './internal'

const LocationContext = createNamedContext('Location')

const LocationProvider = ({ location = window.location, children }) => {
  const getContext = React.useCallback(() => {
    const { pathname, search, hash } = location
    return { pathname, search, hash }
  }, [location])

  const [context, setContext] = React.useState(getContext())

  React.useEffect(() => {
    let isMounted = true
    gHistory.listen(() => {
      if (isMounted) setContext(() => getContext())
    })
    return () => {
      isMounted = false
    }
  }, [getContext])

  return (
    <LocationContext.Provider value={context}>
      {typeof children === 'function' ? children(context) : children || null}
    </LocationContext.Provider>
  )
}

const Location = ({ children }) => (
  <LocationContext.Consumer>
    {(context) =>
      context ? (
        children(context)
      ) : (
        <LocationProvider>{children}</LocationProvider>
      )
    }
  </LocationContext.Consumer>
)

const useLocation = () => {
  const location = React.useContext(LocationContext)
  return location
}

export { Location, LocationProvider, LocationContext, useLocation }
