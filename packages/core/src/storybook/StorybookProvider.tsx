import { ReactNode, ReactPortal, useEffect, useState } from 'react'

import {
  MockProviders,
  startMSW,
  setupRequestHandlers,
} from '@redwoodjs/testing'

export const StorybookProvider: React.FunctionComponent<{
  storyFn: () => ReactNode | ReactPortal
  id: string
}> = ({ storyFn, id }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Import all the `*.mock.*` files.
      const reqs = require.context(
        '~__REDWOOD__USER_WEB_SRC',
        true,
        /.+(mock).(js|ts)$/
      )
      reqs.keys().forEach((r) => {
        reqs(r)
      })

      await startMSW('browsers')
      setupRequestHandlers()
      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return null
  }

  // default to a non-existent user at the beginning of each story
  mockCurrentUser(null)

  return <MockProviders>{storyFn()}</MockProviders>
}
