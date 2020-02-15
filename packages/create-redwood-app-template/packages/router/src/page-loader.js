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
    // This spec is the page where the user has navigated., we'll kick of an async
    // request to import the page's module.
    const { loader, name } = spec

    // If loading the page is taking too long (> `this.props.delay`) then update
    // the context. Consumers of the context can display a loading interstitial.
    this.loadingTimeout = setTimeout(() => {
      this.setState({ slowModuleImport: true })
    }, delay)

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
