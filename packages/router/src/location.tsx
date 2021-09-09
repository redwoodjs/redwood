import React from 'react'

import { createNamedContext, gHistory } from './internal'
import { TrailingSlashesTypes } from './util'

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
  trailingSlashes?: TrailingSlashesTypes
}

class LocationProvider extends React.Component<LocationProviderProps> {
  // When prerendering, there might be more than one level of location providers. Use the values from the one above.
  static contextType = LocationContext
  HISTORY_LISTENER_ID: string | undefined = undefined

  state = {
    context: this.getContext(),
  }

  getContext() {
    let windowLocation

    if (typeof window !== 'undefined') {
      const { pathname } = window.location

      if (this.props.trailingSlashes === 'never' && pathname.endsWith('/')) {
        window.history.replaceState(
          {},
          '',
          pathname.substr(0, pathname.length - 1)
        )
      } else if (
        this.props.trailingSlashes === 'always' &&
        !pathname.endsWith('/')
      ) {
        window.history.replaceState({}, '', pathname + '/')
      }

      windowLocation = window.location
    } else {
      windowLocation = {
        pathname: this.context?.pathname || '',
        search: this.context?.search || '',
        hash: this.context?.hash || '',
      }
    }

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
    return (
      <LocationContext.Provider value={this.state.context}>
        {this.props.children}
      </LocationContext.Provider>
    )
  }
}

const useLocation = () => {
  const location = React.useContext(LocationContext)

  if (location === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }

  return location
}

export { LocationProvider, LocationContext, useLocation }
