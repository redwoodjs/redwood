class InfallibleErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong and we are unable to show this page.</h1>
    }

    return this.props.children
  }
}

class FatalErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    const { page: Page } = this.props
    if (this.state.hasError) {
      return (
        <InfallibleErrorBoundary>
          <Page />
        </InfallibleErrorBoundary>
      )
    }

    return this.props.children
  }
}

export default FatalErrorBoundary
