import { handleContext, context } from '../main'

describe('graphQLServer handleContext', () => {
  it('merges the context correctly', () => {
    const handler = handleContext({ context: { a: 1 } })
    expect(handler({ context: { b: 2 } })).toEqual({
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

  it('deals with undefined contexts properly', () => {
    const handler1 = handleContext()
    expect(handler1({ context: { b: 2 } })).toEqual({
      b: 2,
      callbackWaitsForEmptyEventLoop: false,
    })

    const handler2 = handleContext({ context: { a: 1 } })
    expect(handler2()).toEqual({
      a: 1,
      callbackWaitsForEmptyEventLoop: false,
    })
  })

  it('also accepts a function', () => {
    const handler = handleContext({ context: () => ({ c: 3 }) })
    expect(handler({ context: { d: 4 } })).toEqual({
      c: 3,
      d: 4,
      callbackWaitsForEmptyEventLoop: false,
    })
  })
})
