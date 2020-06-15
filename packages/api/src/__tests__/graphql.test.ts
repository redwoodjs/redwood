import { createContextHandler, context } from '../main'

describe('graphql createContextHandler', () => {
  it('merges the context correctly', async () => {
    const handler = createContextHandler({ a: 1 })
    // @ts-ignore
    expect(await handler({ context: { b: 2 } })).toEqual({
      a: 1,
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
    })

    expect(context).toEqual({
      a: 1,
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
    })
  })

  it('deals with undefined contexts properly', async () => {
    const handler1 = createContextHandler()
    // @ts-ignore
    expect(await handler1({ context: { b: 2 } })).toEqual({
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
    })
  })

  it('also accepts a function', async () => {
    const handler = createContextHandler(() => ({ c: 3 }))
    // @ts-ignore
    expect(await handler({ context: { d: 4 } })).toEqual({
      c: 3,
      d: 4,
      callbackWaitsForEmptyEventLoop: false,
    })
  })

  it('also accepts a promise', async () => {
    const handler = createContextHandler(async () => Promise.resolve({ c: 3 }))
    // @ts-ignore
    expect(await handler({ context: { d: 4 } })).toEqual({
      c: 3,
      d: 4,
      callbackWaitsForEmptyEventLoop: false,
    })
  })
})
