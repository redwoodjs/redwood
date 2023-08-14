import React from 'react'

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

  if (typeof window === 'undefined') {
    // Don't do anything on the server, handled by above callback
    return null
  } else {
    //@TODO HALP These get rendered twice even with the same key, after the React bundle loads
    // but we can't remove this because neeeded for client side nav/render
    // Portals must work differently to standard react diffing.

    // Logic needs to be something like: if (clientSideRouting) { return createPortal } else { return null }
    return createPortal(findableChildren, document.head)
  }
}

export default PortalHead
