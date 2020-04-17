import { createNamedContext, gHistory } from './internal'

const LocationContext = createNamedContext('Location')

class LocationProvider extends React.Component {
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

export { Location, LocationProvider, LocationContext }
