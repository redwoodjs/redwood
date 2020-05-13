import { handleContext, context } from '../main'

describe('graphQLServer handleContext', () => {
  it('merges the context correctly', async () => {
    const handler = handleContext({ context: { a: 1 } })
    expect(await handler({ context: { b: 2 } })).toEqual({
      a: 1,
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
      currentUser: null,
    })
    expect(context).toEqual({
      a: 1,
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
      currentUser: null,
    })
  })

  it('deals with undefined contexts properly', async () => {
    const handler1 = handleContext()
    expect(await handler1({ context: { b: 2 } })).toEqual({
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
      currentUser: null,
    })
  })

  it('also accepts a function', async () => {
    const handler = handleContext({ context: () => ({ c: 3 }) })
    expect(await handler({ context: { d: 4 } })).toEqual({
      c: 3,
      d: 4,
      callbackWaitsForEmptyEventLoop: false,
      currentUser: null,
    })
  })

  it('also accepts a promise', async () => {
    const handler = handleContext({
      context: async () => Promise.resolve({ c: 3 }),
    })
    expect(await handler({ context: { d: 4 } })).toEqual({
      c: 3,
      d: 4,
      callbackWaitsForEmptyEventLoop: false,
      currentUser: null,
    })
  })
})
