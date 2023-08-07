import { createPortal } from 'react-dom'

import { useServerInsertedHTML } from './ServerInject'

const PortalHead: React.FC<React.PropsWithChildren> = ({ children }) => {
  useServerInsertedHTML(() => {
    // @TODO this component should be wrapped in: document.head.append()
    // because its possible for meta tags to be rendered after <head> is closed
    return children
  })

  if (typeof window === 'undefined') {
    // Don't do anything on the server, handled by above callback
    return null
  } else {
    return createPortal(<>{children}</>, document.head)
  }
}

export default PortalHead
