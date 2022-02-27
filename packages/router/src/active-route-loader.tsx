import React, { useRef, useState, useEffect } from 'react'

import { unstable_batchedUpdates } from 'react-dom'

import {
  ActivePageContextProvider,
  LoadingStateRecord,
} from './ActivePageContext'
import { PageLoadingContextProvider } from './PageLoadingContext'
import { useIsMounted } from './useIsMounted'
import { Spec, getAnnouncement, getFocus, resetFocus } from './util'

import { ParamsProvider, useLocation } from '.'

const DEFAULT_PAGE_LOADING_DELAY = 1000 // milliseconds

type synchronousLoaderSpec = () => { default: React.ComponentType<unknown> }

interface Props {
  path: string
  spec: Spec
  delay?: number
  params?: Record<string, string>
  whileLoadingPage?: () => React.ReactElement | null
  children?: React.ReactNode
}

const ArlNullPage = () => null
const ArlWhileLoadingNullPage = () => null

export const ActiveRouteLoader = ({
  path,
  spec,
  delay,
  params,
  whileLoadingPage,
  children,
}: Props) => {
  const location = useLocation()
  const [pageName, setPageName] = useState('')
  const loadingTimeout = useRef<NodeJS.Timeout>()
  const announcementRef = useRef<HTMLDivElement>(null)
  const waitingFor = useRef<string>('')
  const [loadingState, setLoadingState] = useState<LoadingStateRecord>({
    [path]: { page: ArlNullPage, specName: '', state: 'PRE_SHOW', location },
  })
  const [renderedChildren, setRenderedChildren] = useState<
    React.ReactNode | undefined
  >(children)
  const [renderedPath, setRenderedPath] = useState(path)
  const isMounted = useIsMounted()

  const clearLoadingTimeout = () => {
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current)
    }
  }

  useEffect(() => {
    global?.scrollTo(0, 0)

    if (announcementRef.current) {
      announcementRef.current.innerText = getAnnouncement()
    }

    const routeFocus = getFocus()
    if (!routeFocus) {
      resetFocus()
    } else {
      routeFocus.focus()
    }
  }, [pageName, params])

  useEffect(() => {
    const startPageLoadTransition = async (
      { loader, name }: Spec,
      delay: number = DEFAULT_PAGE_LOADING_DELAY
    ) => {
      setLoadingState((loadingState) => ({
        ...loadingState,
        [path]: {
          page: ArlNullPage,
          specName: '',
          state: 'PRE_SHOW',
          location,
        },
      }))

      // Update the context if importing the page is taking longer
      // than `delay`.
      // Consumers of the context can show a loading indicator
      // to signal to the user that something is happening.
      loadingTimeout.current = setTimeout(() => {
        unstable_batchedUpdates(() => {
          setLoadingState((loadingState) => ({
            ...loadingState,
            [path]: {
              page: whileLoadingPage || ArlWhileLoadingNullPage,
              specName: '',
              state: 'SHOW_LOADING',
              location,
            },
          }))
          setRenderedChildren(children)
          setRenderedPath(path)
        })
      }, delay)

      // Wait to download and parse the page.
      waitingFor.current = name
      const module = await loader()

      // Remove the timeout because the page has loaded.
      clearLoadingTimeout()

      // Only update all state if we're still interested (i.e. we're still
      // waiting for the page that just finished loading)
      if (isMounted() && name === waitingFor.current) {
        unstable_batchedUpdates(() => {
          setLoadingState((loadingState) => ({
            ...loadingState,
            [path]: {
              page: module.default,
              specName: name,
              state: 'DONE',
              location,
            },
          }))
          setRenderedChildren(children)
          setRenderedPath(path)
          setPageName(name)
        })
      }
    }

    if (spec.name !== waitingFor.current) {
      clearLoadingTimeout()
      startPageLoadTransition(spec, delay)
    } else {
      unstable_batchedUpdates(() => {
        // Handle navigating to the same page again, but with different path
        // params (i.e. new `location` or route params)
        setLoadingState((loadingState) => {
          // If path is same, fetch the page again
          let existingPage = loadingState[path]?.page
          // If path is different, try to find the existing page
          if (!existingPage) {
            const pageState = Object.values(loadingState).find(
              (state) => state?.specName === spec.name
            )
            existingPage = pageState?.page
          }
          return {
            ...loadingState,
            [path]: {
              page: existingPage || ArlNullPage,
              specName: spec.name,
              state: 'DONE',
              location,
            },
          }
        })
        setRenderedChildren(children)
        setRenderedPath(path)
      })
    }

    return () => {
      clearLoadingTimeout()
    }
  }, [spec, delay, children, whileLoadingPage, path, location, isMounted])

  // It might feel tempting to move this code further up in the file for an
  // "early return", but React doesn't allow that because pretty much all code
  // above is hooks, and they always need to come before any `return`
  if (global.__REDWOOD__PRERENDERING) {
    // babel auto-loader plugin uses withStaticImport in prerender mode
    // override the types for this condition
    const syncPageLoader = spec.loader as unknown as synchronousLoaderSpec
    const PageFromLoader = syncPageLoader().default

    const prerenderLoadingState: LoadingStateRecord = {
      [path]: {
        state: 'DONE',
        specName: spec.name,
        page: PageFromLoader,
        location,
      },
    }

    return (
      <ParamsProvider path={path} location={location}>
        <PageLoadingContextProvider value={{ loading: false }}>
          <ActivePageContextProvider
            value={{ loadingState: prerenderLoadingState }}
          >
            {children}
          </ActivePageContextProvider>
        </PageLoadingContextProvider>
      </ParamsProvider>
    )
  }

  return (
    <ParamsProvider
      path={renderedPath}
      location={loadingState[renderedPath]?.location}
    >
      <ActivePageContextProvider value={{ loadingState }}>
        <PageLoadingContextProvider
          value={{
            loading: loadingState[renderedPath]?.state === 'SHOW_LOADING',
          }}
        >
          {renderedChildren}
          {loadingState[path]?.state === 'DONE' && (
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
              ref={announcementRef}
            ></div>
          )}
        </PageLoadingContextProvider>
      </ActivePageContextProvider>
    </ParamsProvider>
  )
}
