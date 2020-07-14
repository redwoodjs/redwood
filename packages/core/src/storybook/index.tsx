import { useEffect, useState } from 'react'
import {
  MockProviders,
  mockData,
  getMockData,
  MOCK_DATA,
  msw,
} from '@redwoodjs/testing'

global.mockData = mockData
global.__RW__mockData = mockData
global.getMockData = getMockData
global.__RW__getMockData = getMockData

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
      console.groupCollapsed(`[RW] Found ${reqs.length} mock file(s)`)
      reqs.keys().forEach((r) => {
        console.log(r)
        reqs(r)
      })
      console.groupEnd()

      await msw.start()
      // Reset the msw handlers since a user can overwrite them.
      msw.getServer().resetHandlers()
      // Set GraphQL query and mutuation handlers for each MOCK_DATA value.
      // Skip the generated handlers.
      console.groupCollapsed('[RW] Mocking GraphQL resolvers')
      for (const name of Object.keys(MOCK_DATA).filter(
        (n) => !n.includes(':')
      )) {
        console.groupCollapsed(name)
        const data = MOCK_DATA[name]
        console.log(JSON.stringify(data, null, 2))
        const mockHandler = (_req: any, res: any, ctx: any) =>
          res(ctx.data(data))
        msw.graphql.query(name, mockHandler)
        msw.graphql.mutation(name, mockHandler)
        console.groupEnd()
      }
      console.groupEnd()
      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return null
  }

  return <MockProviders>{storyFn()}</MockProviders>
}
