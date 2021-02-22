import React, { useContext } from 'react'

import isEqual from 'lodash.isequal'

import { createNamedContext, ParamsContext, Spec } from './internal'

export const PageLoadingContext = createNamedContext<{ loading: boolean }>(
  'PageLoading',
  {
    loading: true,
  }
)

export const usePageLoadingContext = () => useContext(PageLoadingContext)

type synchonousLoaderSpec = () => { default: React.ComponentType }
interface State {
  Page?: React.ComponentType
  pageName?: string
  slowModuleImport: boolean
  params?: Record<string, string>
}

interface Props {
  spec: Spec
  delay?: number
  params?: Record<string, string>
}

export class PageLoader extends React.Component<Props> {
  state: State = {
    Page: undefined,
    pageName: undefined,
    slowModuleImport: false,
  }

  loadingTimeout?: number = undefined

  propsChanged = (p1: Props, p2: Props) => {
    if (p1.spec.name !== p2.spec.name) {
      return true
    }
    return !isEqual(p1.params, p2.params)
  }

  stateChanged = (s1: State, s2: State) => {
    if (s1.pageName !== s2.pageName) {
      return true
    }
    return !isEqual(s1.params, s2.params)
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
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

  componentDidUpdate(prevProps: Props) {
    if (this.propsChanged(prevProps, this.props)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition(this.props)
    }
  }

  clearLoadingTimeout = () => {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
    }
  }

  startPageLoadTransition = async (props: Props) => {
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

    if (global.__REDWOOD__PRERENDERING) {
      // babel autoloader plugin uses withStaticImport in prerender mode
      // override the types for this condition
      const syncPageLoader = (this.props.spec
        .loader as unknown) as synchonousLoaderSpec
      const PageFromLoader = syncPageLoader().default

      return (
        <ParamsContext.Provider value={this.state.params}>
          <PageFromLoader />
        </ParamsContext.Provider>
      )
    }

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
