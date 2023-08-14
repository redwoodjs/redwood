import React, { useEffect } from 'react'

import { createPortal } from 'react-dom'

import { useServerInsertedHTML } from './ServerInject'

function addDataAttributeMarker(children: React.ReactNode) {
  return React.Children.toArray(children).map((child, i) => {
    return React.cloneElement(child as React.ReactElement, {
      'data-rwjs-head': true,
      key: 'data-rwjs-head-' + i,
    })
  })
}

const PortalHead: React.FC<React.PropsWithChildren> = ({ children }) => {
  const findableChildren = addDataAttributeMarker(children)

  useServerInsertedHTML(() => {
    // Add "data-rwjs-head" attribute to anything inside <PortalHead>,
    // This is then later moved to the <head> in the final block of the transform stream (see streamHelpers.ts)
    return findableChildren
  })

  const [shouldPortal, setShouldPortal] = React.useState(
    // This default state is important, effectively:
    // On Hard render (before stream end): false, on Soft render: true
    // Remember multiple PortalHeads maybe rendered, and may be rendered by client-side routing
    document.readyState === 'complete'
  )

  useEffect(() => {
    const handler = (_e: Event) => {
      // This event fires for "interactive" and "complete"
      // Once streaming is complete, allow client side portal rendering
      if (document.readyState === 'complete') {
        setShouldPortal(true)
      }
    }

    document.addEventListener('readystatechange', handler)

    return () => {
      document.removeEventListener('readystatechange', handler)
    }
  }, [])

  if (typeof window === 'undefined') {
    // Don't do anything on the server, handled by above callback
    return null
  } else {
    return shouldPortal ? createPortal(findableChildren, document.head) : null
  }
}

export default PortalHead
