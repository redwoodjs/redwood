import { createPortal } from 'react-dom'

import { useServerInsertedHTML } from './ServerInject'

const PortalHead: React.FC<React.PropsWithChildren> = ({ children }) => {
  useServerInsertedHTML(() => {
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
