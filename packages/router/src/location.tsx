import React from 'react'

import { gHistory } from './history'
import { createNamedContext, TrailingSlashesTypes } from './util'

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
  children?: React.ReactNode
}

class LocationProvider extends React.Component<LocationProviderProps> {
  // When prerendering, there might be more than one level of location
  // providers. Use the values from the one above.
  static contextType = LocationContext
  HISTORY_LISTENER_ID: string | undefined = undefined

  state = {
    context: this.getContext(),
  }

  getContext() {
    let windowLocation

    if (typeof window !== 'undefined') {
      const { pathname } = window.location

      // Since we have to update the URL, we might as well handle the trailing
      // slash here, before matching.
      //
      // - never -> strip trailing slashes ("/about/" -> "/about")
      // - always -> add trailing slashes ("/about" -> "/about/")
      // - preserve -> do nothing ("/about" -> "/about", "/about/" -> "/about/")
      //
      switch (this.props.trailingSlashes) {
        case 'never':
          if (pathname.endsWith('/')) {
            window.history.replaceState(
              {},
              '',
              pathname.substr(0, pathname.length - 1)
            )
          }
          break

        case 'always':
          if (!pathname.endsWith('/')) {
            window.history.replaceState({}, '', pathname + '/')
          }
          break

        default:
          break
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
