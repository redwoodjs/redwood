import {
  createTestkit,
  createSpiedPlugin,
  assertStreamExecutionValue,
} from '@envelop/testing'

import { testLiveQuery, testSchema } from '../__fixtures__/common'
import {
  useRedwoodRealtime,
  InMemoryLiveQueryStore,
} from '../useRedwoodRealtime'

describe('useRedwoodRealtime', () => {
  const liveQueryStore = new InMemoryLiveQueryStore()

  it('should support a @live query directive', async () => {
    const testkit = createTestkit(
      [useRedwoodRealtime({ liveQueries: { liveQueryStore } })],
      testSchema
    )

    const result = await testkit.execute(testLiveQuery, {}, {})

    assertStreamExecutionValue(result)
    const current = await result.next()
    expect(current.value).toMatchInlineSnapshot(`
      {
        "data": {
          "me": {
            "id": "1",
            "name": "Ba Zinga",
          },
        },
        "isLive": true,
      }
    `)
  })

  it('should update schema with live directive', async () => {
    const spiedPlugin = createSpiedPlugin()

    // the original schema should not have the live directive before the useRedwoodRealtime plugin is applied
    expect(testSchema.getDirective('live')).toBeUndefined()

    createTestkit(
      [
        useRedwoodRealtime({ liveQueries: { liveQueryStore } }),
        spiedPlugin.plugin,
      ],
      testSchema
    )

    // the replaced schema should have the live directive afterwards
    const replacedSchema =
      spiedPlugin.spies.onSchemaChange.mock.calls[0][0].schema

    const liveDirectiveOnSchema = replacedSchema.getDirective('live')

    expect(liveDirectiveOnSchema.name).toEqual('live')
    expect(replacedSchema.getDirective('live')).toMatchSnapshot()
  })
})
