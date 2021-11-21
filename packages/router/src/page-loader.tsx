import React, { useContext } from 'react'

import isEqual from 'lodash.isequal'
import { unstable_batchedUpdates } from 'react-dom'

import { Spec } from './router'
import {
  RouterState,
  useRouterState,
  useRouterStateSetter,
} from './router-context'
import {
  createNamedContext,
  getAnnouncement,
  getFocus,
  resetFocus,
} from './util'

export interface PageLoadingContextInterface {
  loading: boolean
}

export const PageLoadingContext =
  createNamedContext<PageLoadingContextInterface>('PageLoading')

export const usePageLoadingContext = () => {
  const pageLoadingContext = useContext(PageLoadingContext)

  if (!pageLoadingContext) {
    throw new Error(
      'usePageLoadingContext must be used within a PageLoadingContext provider'
    )
  }

  return pageLoadingContext
}

type synchonousLoaderSpec = () => { default: React.ComponentType }
interface State {
  slowModuleImport: boolean
}

interface PageLoaderProps {
  spec: Spec
  delay?: number
  params?: Record<string, string>
  whileLoadingPage?: () => React.ReactElement | null
}
interface Props extends PageLoaderProps {
  currentRoute?: {
    pageName: string
    Page?: React.ComponentType | null
    params?: Record<string, string>
  }
  setRouterState: React.Dispatch<Partial<RouterState>>
}

class PageLoaderWithRouterContext extends React.Component<Props> {
  state: State = {
    slowModuleImport: false,
  }

  loadingTimeout?: number = undefined

  propsChanged = (p1: Props, p2: Props) => {
    if (p1.spec.name !== p2.spec.name) {
      return true
    }
    return !isEqual(p1.params, p2.params)
  }

  stateChanged = (s1: State, s2: State) =>
    s1.slowModuleImport !== s2.slowModuleImport

  pageNameChanged = (p1: Props, p2: Props) =>
    p1.currentRoute?.pageName !== p2.currentRoute?.pageName

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (this.propsChanged(this.props, nextProps)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition(nextProps)
      return false
    }

    if (
      this.pageNameChanged(this.props, nextProps) ||
      this.stateChanged(this.state, nextState)
    ) {
      return true
    }

    return true
  }

  componentDidMount() {
    this.startPageLoadTransition(this.props)
  }

  // for announcing the new page to screen readers
  announcementRef = React.createRef<HTMLDivElement>()

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.propsChanged(prevProps, this.props)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition(this.props)
    }

    if (
      this.pageNameChanged(prevProps, this.props) ||
      this.stateChanged(prevState, this.state)
    ) {
      global?.scrollTo(0, 0)
      if (this.announcementRef.current) {
        this.announcementRef.current.innerText = getAnnouncement()
      }
      const routeFocus = getFocus()
      if (!routeFocus) {
        resetFocus()
      } else {
        routeFocus.focus()
      }
    }
  }

  componentWillUnmount() {
    this.setState = () => {} // Prevent updating state after component has been unmounted.
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
    ) as unknown as number

    // Wait to download and parse the page.
    const module = await loader()

    // Remove the timeout because the page has loaded.
    this.clearLoadingTimeout()

    // Update downloaded page in the Router Context to avoid
    // blank page (page: undefined) when Route unmounts (and therefore PageLoader)

    // Batched update is to avoid unnecessary re-rendering
    unstable_batchedUpdates(() => {
      this.props.setRouterState({
        activeRoute: {
          pageName: name,
          Page: module.default,
          params: props.params,
        },
      })

      this.setState({
        slowModuleImport: false,
      })
    })
  }

  render() {
    if (global.__REDWOOD__PRERENDERING) {
      // babel autoloader plugin uses withStaticImport in prerender mode
      // override the types for this condition
      const { params: newParams } = this.props
      const syncPageLoader = this.props.spec
        .loader as unknown as synchonousLoaderSpec
      const PageFromLoader = syncPageLoader().default

      return (
        <PageLoadingContext.Provider value={{ loading: false }}>
          <PageFromLoader {...newParams} />
        </PageLoadingContext.Provider>
      )
    }

    // Page will always be there, either old one or the latest (except first load / hard refresh)
    // So we have to check if we want to show loading state before rendering the Page
    const { slowModuleImport } = this.state
    const { whileLoadingPage } = this.props
    if (slowModuleImport && whileLoadingPage) {
      return this.props.whileLoadingPage?.() || null
    }

    // currentRoute holds the last page until new page chunk is loaded
    const { Page, params } = this.props.currentRoute || {}
    if (!Page) {
      return null
    }

    return (
      <PageLoadingContext.Provider
        value={{ loading: this.state.slowModuleImport }}
      >
        <Page {...params} />
        <div
          id="redwood-announcer"
          style={{
            position: 'absolute',
            top: 0,
            width: 1,
            height: 1,
            padding: 0,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          ref={this.announcementRef}
        ></div>
      </PageLoadingContext.Provider>
    )
  }
}

export const PageLoader = (props: PageLoaderProps) => {
  const { activeRoute } = useRouterState()
  const setRouterState = useRouterStateSetter()
  return (
    <PageLoaderWithRouterContext
      currentRoute={activeRoute}
      setRouterState={setRouterState}
      {...props}
    />
  )
}
