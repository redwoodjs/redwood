import { useEffect, useState } from 'react'
import { MockProviders, mockData, getMockData, msw } from '@redwoodjs/testing'

global.mockData = mockData
global.__RW__mockData = mockData
global.getMockData = getMockData
global.__RW__getMockData = getMockData

export const StorybookLoader = ({ storyFn }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await msw.start()
      // Import all the `*.mock.*` files.
      const reqs = require.context(
        '~__REDWOOD__USER_WEB_SRC',
        true,
        /.+(mock).(js|ts)$/
      )
      reqs.keys().forEach((r) => {
        reqs(r)
      })

      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return null
  }

  return <MockProviders>{storyFn()}</MockProviders>
}
