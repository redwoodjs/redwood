import React from 'react'

import { createNamedContext, gHistory } from './internal'

export interface LocationContextType {
  pathname: string
  search?: string
  hash?: string
}

const LocationContext = createNamedContext<LocationContextType>('Location')

interface LocationProviderProps {
  location?: {
    pathname: string
    search?: string
    hash?: string
  }
}

class LocationProvider extends React.Component<LocationProviderProps> {
  HISTORY_LISTENER_ID: string | undefined = undefined

  state = {
    context: this.getContext(),
  }

  getContext() {
    const windowLocation =
      typeof window !== 'undefined'
        ? window.location
        : { pathname: '', search: '', hash: '' }
    const { pathname, search, hash } = this.props.location || windowLocation

    return { pathname, search, hash }
  }

  componentDidMount() {
    this.HISTORY_LISTENER_ID = gHistory.listen(() => {
      this.setState(() => ({ context: this.getContext() }))
    })
  }

  componentWillUnmount() {
    if (this.HISTORY_LISTENER_ID) {
      gHistory.remove(this.HISTORY_LISTENER_ID)
    }
  }

  render() {
    const { children } = this.props
    const { context } = this.state

    return (
      <LocationContext.Provider value={context}>
        {typeof children === 'function' ? children(context) : children || null}
      </LocationContext.Provider>
    )
  }
}

interface LocationProps {
  children: (context: LocationContextType) => React.ReactChild
}

const Location = ({ children }: LocationProps) => (
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
