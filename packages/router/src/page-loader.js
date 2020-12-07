import { useContext } from 'react'

import isEqual from 'lodash.isequal'

import { createNamedContext, ParamsContext } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

export const usePageLoadingContext = () => useContext(PageLoadingContext)

export class PageLoader extends React.Component {
  state = {
    Page: undefined,
    pageName: undefined,
    slowModuleImport: false,
  }

  propsChanged = (p1, p2) => {
    if (p1.spec.name !== p2.spec.name) {
      return true
    }
    return !isEqual(p1.params, p2.params)
  }

  stateChanged = (s1, s2) => {
    if (s1.pageName !== s2.pageName) {
      return true
    }
    return !isEqual(s1.params, s2.params)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.propsChanged(this.props, nextProps)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition(nextProps)
      return false
    }

    if (this.stateChanged(this.state, nextState)) {
      return true
    }

    return true
  }

  componentDidMount() {
    this.startPageLoadTransition(this.props)
  }

  componentDidUpdate(prevProps) {
    if (this.propsChanged(prevProps, this.props)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition(this.props)
    }
  }

  clearLoadingTimeout = () => {
    clearTimeout(this.loadingTimeout)
  }

  startPageLoadTransition = async (props) => {
    const { spec, delay } = props
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
      params: props.params,
    })
  }

  render() {
    const { Page } = this.state
    if (Page) {
      return (
        <ParamsContext.Provider value={this.state.params}>
          <PageLoadingContext.Provider
            value={{ loading: this.state.slowModuleImport }}
          >
            <Page {...this.state.params} />
          </PageLoadingContext.Provider>
        </ParamsContext.Provider>
      )
    } else {
      return null
    }
  }
}
