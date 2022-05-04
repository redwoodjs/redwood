import type { ReactNode, ReactPortal } from 'react'
import * as React from 'react'

import { MockProviders } from './MockProviders'
import { setupRequestHandlers, startMSW, mockCurrentUser } from './mockRequests'

export const MockingLoader = async () => {
  const reqs = require.context(
    '~__REDWOOD__USER_WEB_SRC',
    true,
    /.+(mock).(js|ts)$/
  )
  reqs.keys().forEach(reqs)

  await startMSW('browsers')
  setupRequestHandlers()

  return {}
}

export const StorybookProvider: React.FunctionComponent<{
  storyFn: () => ReactNode | ReactPortal
  id: string
}> = ({ storyFn }) => {
  // default to a non-existent user at the beginning of each story
  mockCurrentUser(null)

  return <MockProviders>{storyFn()}</MockProviders>
}
