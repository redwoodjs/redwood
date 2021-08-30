import { createTestkit } from '@envelop/testing'

import { context, getAsyncStoreInstance } from '../../index'
import { testSchema, testQuery } from '../__fixtures__/common'
import { useRedwoodGlobalContextSetter } from '../useRedwoodGlobalContextSetter'
import { useRedwoodPopulateContext } from '../useRedwoodPopulateContext'

afterAll(() => {
  process.env.SAFE_GLOBAL_CONTEXT = '0' // set to default
})

test('Safe Context OFF: Updates global context with extended context', async () => {
  process.env.SAFE_GLOBAL_CONTEXT = '0' // default: use async local storage
  const testkit = createTestkit(
    [
      useRedwoodPopulateContext(() => ({ hello: 'world' })),
      useRedwoodPopulateContext({ foo: 'bar' }),
      useRedwoodGlobalContextSetter(),
    ],
    testSchema
  )

  await getAsyncStoreInstance().run(new Map(), async () => {
    await testkit.execute(testQuery, {}, {})

    expect(context.hello).toBe('world')
    expect(context.foo).toBe('bar')
    expect(context.bazinga).not.toBeDefined() // just an extra check here because this test is async
  })
})

test('Safe Context ON: Updates global context with extended context', async () => {
  process.env.SAFE_GLOBAL_CONTEXT = '1' // user is saying its safe to not proxy the context

  const testkit = createTestkit(
    [
      useRedwoodGlobalContextSetter(),
      useRedwoodPopulateContext(() => ({ hello: 'world' })),
      useRedwoodPopulateContext({ foo: 'bar' }),
    ],
    testSchema
  )

  await testkit.execute(testQuery, {}, {})

  expect(context.hello).toBe('world')
  expect(context.foo).toBe('bar')
})
