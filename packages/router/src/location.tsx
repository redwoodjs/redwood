import React from 'react'

import { createNamedContext, gHistory } from './internal'

type WindowLocation = typeof window.location

const LocationContext = createNamedContext<Partial<WindowLocation>>('Location')

class LocationProvider extends React.Component<{ location: WindowLocation }> {
  static defaultProps = {
    location: window.location,
  }

  state = {
    context: this.getContext(),
  }

  getContext() {
    const { pathname, search, hash } = this.props.location
    return { pathname, search, hash }
  }

  componentDidMount() {
    gHistory.listen(() => {
      this.setState(() => ({ context: this.getContext() }))
    })
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

const Location: React.FC<{
  children: (context: Partial<WindowLocation>) => React.ReactNode
}> = ({ children }) => (
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

export { Location, LocationContext }
