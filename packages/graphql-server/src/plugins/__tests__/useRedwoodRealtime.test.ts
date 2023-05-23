import {
  createTestkit,
  createSpiedPlugin,
  assertStreamExecutionValue,
} from '@envelop/testing'

import { testLiveSchema, testLiveQuery } from '../__fixtures__/common'
import {
  useRedwoodRealtime,
  InMemoryLiveQueryStore,
} from '../useRedwoodRealtime'

describe('useRedwoodRealtime', () => {
  const liveQueryStore = new InMemoryLiveQueryStore()

  it('should support a @live query directive', async () => {
    const testkit = createTestkit(
      [useRedwoodRealtime({ liveQueryStore })],
      testLiveSchema
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

    const testkit = createTestkit(
      [useRedwoodRealtime({ liveQueryStore }), spiedPlugin.plugin],
      testLiveSchema
    )

    await testkit.execute(testLiveQuery, {}, {})

    // the schema should have been updated with the live directive
    // "schema": GraphQLSchema {
    //   "__validationErrors": [],
    //   "_directives": [
    //     "@live",
    //     "@include",
    //     "@skip",
    //     "@deprecated",
    //     "@specifiedBy",
    //   ],
    expect(spiedPlugin.plugin.onSchemaChange).toMatchSnapshot()
  })
})
