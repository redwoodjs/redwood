import path from 'path'

import {
  LAMBDA_FUNCTIONS,
  loadFunctionsFromDist,
} from '../plugins/lambdaLoader'

// Suppress terminal logging.
console.log = jest.fn()
console.warn = jest.fn()

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = path.resolve(__dirname, 'fixtures/redwood-app')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Reset the LAMBDA_FUNCTIONS object after each test.
afterEach(() => {
  for (const key in LAMBDA_FUNCTIONS) {
    delete LAMBDA_FUNCTIONS[key]
  }
})

describe('loadFunctionsFromDist', () => {
  it('loads functions from the api/dist directory', async () => {
    expect(LAMBDA_FUNCTIONS).toEqual({})

    await loadFunctionsFromDist()

    expect(LAMBDA_FUNCTIONS).toEqual({
      env: expect.any(Function),
      graphql: expect.any(Function),
      health: expect.any(Function),
      hello: expect.any(Function),
      nested: expect.any(Function),
    })
  })

  // We have logic that specifically puts the graphql function at the front.
  it('puts the graphql function first', async () => {
    expect(LAMBDA_FUNCTIONS).toEqual({})

    await loadFunctionsFromDist()

    expect(Object.keys(LAMBDA_FUNCTIONS)[0]).toEqual('graphql')
  })

  // `loadFunctionsFromDist` loads files that don't export a handler into the object.
  it("warns if a function doesn't have a handler and sets it to `undefined`", async () => {
    expect(LAMBDA_FUNCTIONS).toEqual({})

    await loadFunctionsFromDist()

    expect(LAMBDA_FUNCTIONS).toMatchObject({
      noHandler: undefined,
    })

    expect(console.warn).toHaveBeenCalledWith(
      'noHandler',
      'at',
      expect.any(String),
      'does not have a function called handler defined.'
    )
  })
})
