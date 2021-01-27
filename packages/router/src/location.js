import { createNamedContext, gHistory } from './internal'

const LocationContext = createNamedContext('Location')

class LocationProvider extends React.Component {
  HISTORY_LISTENER_ID = undefined

  state = {
    context: this.getContext(),
  }

  getContext() {
    const windowLocation = typeof window !== 'undefined' ? window.location : {}
    const { pathname = '', search = '', hash = '' } =
      this.props.location || windowLocation

    return { pathname, search, hash }
  }

  componentDidMount() {
    this.HISTORY_LISTENER_ID = gHistory.listen(() => {
      this.setState(() => ({ context: this.getContext() }))
    })
  }

  componentWillUnmount() {
    gHistory.remove(this.HISTORY_LISTENER_ID)
  }

  render() {
    let { children } = this.props
    let { context } = this.state
    return (
      <LocationContext.Provider value={context}>
        {typeof children === 'function' ? children(context) : children || null}
      </LocationContext.Provider>
    )
  }
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
