import React, { useContext } from 'react'

import { createNamedContext } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

export const usePageLoadingContext = () => useContext(PageLoadingContext)

interface PageLoaderState {
  Page?: any
  pageName?: string
  slowModuleImport: boolean
}

interface PageLoaderProps {
  spec: {
    name: string
    loader: () => void
  }
  delay: number
  params: Record<string, string>
}

export class PageLoader extends React.PureComponent<
  PageLoaderProps,
  PageLoaderState
> {
  private loadingTimeout?: number | NodeJS.Timeout
  readonly state = {
    Page: undefined,
    pageName: undefined,
    slowModuleImport: false,
  }

  componentDidMount() {
    this.startPageLoadTransition()
  }

  componentDidUpdate(prevProps: PageLoaderProps) {
    if (prevProps.spec.name !== this.props.spec.name) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition()
    }
  }

  clearLoadingTimeout = () => {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
    }
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
        </PageLoadingContext.Provider>
      )
    } else {
      return null
    }
  }
}
