import { useContext, createRef } from 'react'

import { createNamedContext, LocationContext } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

export const usePageLoadingContext = () => useContext(PageLoadingContext)

/**
 * This is a WIP; the location of this component will most likely change
 * (we'll probably move it up the tree).
 * The majority of this code was copied from
 * https://github.com/gatsbyjs/gatsby/blob/5b15471e793aa16d8e63ad920d0f8c4c4f46052f/packages/gatsby/cache-dir/navigation.js#L161-L208
 * Blog post explaining this code here:
 * https://www.gatsbyjs.org/blog/2020-02-10-accessible-client-side-routing-improvements/ */
const RouteAnnouncer = () => {
  const location = useContext(LocationContext)
  const announcement = `New page at ${location.pathname}`

  return (
    <div
      style={{
        position: `absolute`,
        width: 1,
        height: 1,
        padding: 0,
        overflow: `hidden`,
        clip: `rect(0, 0, 0, 0)`,
        whiteSpace: `nowrap`,
        border: 0,
      }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >{announcement}</div>
  )
}

export class PageLoader extends React.PureComponent {
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

    // Wait to download and parse the page.
    const module = await loader()

    // Remove the timeout because the page has loaded.
    this.clearLoadingTimeout()

    this.setState({
      pageName: name,
      Page: module.default,
      slowModuleImport: false,
      params: this.props.params,
    })
  }

  render() {
    const { Page } = this.state
    if (Page) {
      return (
        <PageLoadingContext.Provider
          value={{ loading: this.state.slowModuleImport }}
        >
          <Page {...this.state.params} />
          <RouteAnnouncer />
        </PageLoadingContext.Provider>
      )
    } else {
      return null
    }
  }
}
