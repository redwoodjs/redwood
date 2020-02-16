import { useContext } from 'react'

import { createNamedContext } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

export const usePageLoadingContext = () => useContext(PageLoadingContext)

export class PageLoader extends React.Component {
  state = {
    Page: undefined,
    pageName: undefined,
    slowModuleImport: false,
  }

  componentDidMount() {
    this.startPageLoadTransition()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.spec.name !== this.props.spec.name) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition()
    }
  }

  clearLoadingTimeout = () => {
    clearTimeout(this.loadingTimeout)
  }

  startPageLoadTransition = async () => {
    const { spec, delay } = this.props
    const { loader, name } = spec

    // Update the context if importing the page is taking longer
    // than `delay`.
    // Consumers of the context can show a loading indicator
    // to signal to the user that something is happening.
    this.loadingTimeout = setTimeout(
      () => this.setState({ slowModuleImport: true }),
      delay
    )

    const module = await loader()

    // Remove the timeout because the page has loaded.
    this.clearLoadingTimeout()

    this.setState({
      pageName: name,
      Page: module.default,
      slowModuleImport: false,
    })
  }

  render() {
    const { Page } = this.state
    if (Page) {
      return (
        <PageLoadingContext.Provider
          value={{ loading: this.state.slowModuleImport }}
        >
          <Page {...this.props.params} />
        </PageLoadingContext.Provider>
      )
    } else {
      return null
    }
  }
}
