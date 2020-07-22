import { useEffect, useState } from 'react'
import {
  MockProviders,
  startMSW,
  setupRequestHandlers,
} from '@redwoodjs/testing'

export const StorybookLoader: React.FunctionComponent<{
  storyFn: Function
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

      await startMSW()
      setupRequestHandlers()
      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return null
  }

  return <MockProviders>{storyFn()}</MockProviders>
}
