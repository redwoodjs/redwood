import { createTestkit } from '@envelop/testing'

import { context } from '../../index'
import { testSchema, testQuery } from '../__fixtures__/common'
import { useRedwoodGlobalContextSetter } from '../useRedwoodGlobalContextSetter'
import { useRedwoodPopulateContext } from '../useRedwoodPopulateContext'

afterAll(() => {
  process.env.SAFE_GLOBAL_CONTEXT = '0' // set to default
})

// @TODO why do we need to set SAFE_GLOBAL_CONTEXT for these tests to pass?
// !WARN: DO NOT MERGE THIS INTO MAIN
test('Safe Context OFF: Updates global context with extended context', async () => {
  process.env.SAFE_GLOBAL_CONTEXT = '0' // default: use async local storage

  const teskit = createTestkit(
    [
      useRedwoodGlobalContextSetter(),
      useRedwoodPopulateContext(() => ({ hello: 'world' })),
      useRedwoodPopulateContext({ foo: 'bar' }),
    ],
    testSchema
  )

  await teskit.execute(testQuery, {}, {})

  console.log(context) //?
  expect(context.hello).toBe('world')
  expect(context.foo).toBe('bar')
})

test('Safe Context ON: Updates global context with extended context', async () => {
  process.env.SAFE_GLOBAL_CONTEXT = '1' // user is saying its safe to not proxy the context

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
