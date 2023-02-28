import React, { Suspense, useEffect, useRef } from 'react'

import { getAnnouncement, getFocus, resetFocus } from './a11yUtils'
import { inIframe, Spec } from './util'

interface Props {
  path: string
  spec: Spec
  delay?: number
  params?: Record<string, string>
  whileLoadingPage?: () => React.ReactElement | null
  children?: React.ReactNode
}

export const ActiveRouteLoader = ({ spec, params }: Props) => {
  const announcementRef = useRef<HTMLDivElement>(null)
  const LazyRouteComponent = spec.LazyComponent

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

  // @MARK we need to wrap this outside the component, may be in spec normalizer
  // https://beta.reactjs.org/reference/react/lazy#my-lazy-components-state-gets-reset-unexpectedly

  return (
    <Suspense>
      <LazyRouteComponent />
    </Suspense>
  )
}
