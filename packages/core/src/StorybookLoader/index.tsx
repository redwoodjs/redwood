import { useEffect, useState } from 'react'
import { MockProviders } from '@redwoodjs/testing/dist/MockProviders'
import { mockData, getMockData } from '@redwoodjs/testing/dist/mockData'

global.mockData = mockData
global.__RW__mockData = mockData
global.getMockData = getMockData
global.__RW__getMockData = getMockData

export default ({ storyFn }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  if (loading) {
    return null
  }

  return <MockProviders>{storyFn()}</MockProviders>
}
