import { createTestkit } from '@envelop/testing'

import { context } from '../../index'
import { testSchema, testQuery } from '../__fixtures__/common'
import { useRedwoodGlobalContextSetter } from '../useRedwoodGlobalContextSetter'
import { useRedwoodPopulateContext } from '../useRedwoodPopulateContext'

// @TODO why do we need to set SAFE_GLOBAL_CONTEXT for these tests to pass?
// !WARN: DO NOT MERGE THIS INTO MAIN

// beforeAll(() => {
//   process.env.SAFE_GLOBAL_CONTEXT = '1' // use AsyncLocalStorage (serverful)
// })

// afterAll(() => {
//   process.env.SAFE_GLOBAL_CONTEXT = '0' // keep in memory (serverless)
// })

test('Updates global context with extended context', async () => {
  const teskit = createTestkit(
    [
      useRedwoodGlobalContextSetter(),
      useRedwoodPopulateContext(() => ({ hello: 'world' })),
      useRedwoodPopulateContext({ foo: 'bar' }),
    ],
    testSchema
  )

  await teskit.execute(testQuery, {}, {})

  expect(context.hello).toBe('world')
  expect(context.foo).toBe('bar')
})
