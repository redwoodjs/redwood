import React, { Suspense, useEffect, useRef } from 'react'

import { getAnnouncement, getFocus, resetFocus } from './a11yUtils'
import { inIframe, Spec } from './util'

interface Props {
  path: string
  spec: Spec
  delay?: number
  params?: Record<string, string>
  whileLoadingPage?: () => React.ReactNode | null
  children?: React.ReactNode
}

let isPrerendered = false

if (typeof window !== 'undefined') {
  const redwoodAppElement = document.getElementById('redwood-app')

  if (redwoodAppElement && redwoodAppElement.children.length > 0) {
    isPrerendered = true
  }
}

const firstLoad = true

export const ActiveRouteLoader = ({
  spec,
  params,
  whileLoadingPage,
}: Props) => {
  const announcementRef = useRef<HTMLDivElement>(null)

  const usePrerenderLoader =
    globalThis.__REDWOOD__PRERENDERING || (isPrerendered && firstLoad)

  const LazyRouteComponent = usePrerenderLoader
    ? spec.prerenderLoader(spec.name).default
    : spec.LazyComponent

  useEffect(() => {
    // Make this hook a no-op if we're rendering in an iframe.
    if (inIframe()) {
      return
    }

    globalThis?.scrollTo(0, 0)

    if (announcementRef.current) {
      announcementRef.current.innerText = getAnnouncement()
    }

    const routeFocus = getFocus()
    if (!routeFocus) {
      resetFocus()
    } else {
      routeFocus.focus()
    }
  }, [spec, params])

  // @TODO whileLoadingPage is undefined, why?
  return (
    <Suspense fallback={whileLoadingPage?.()}>
      <LazyRouteComponent {...params} />
      {/* @TODO why do we need activePageContext in InternalRoute??? */}
      {/* @TODO adding announcer causes hydration warnings */}
      {/* <div
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
            ></div> */}
    </Suspense>
  )
}
