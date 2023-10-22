import { vol } from 'memfs'

import {
  LAMBDA_FUNCTIONS,
  loadFunctionsFromDist,
} from '../plugins/lambdaLoader'

// Suppress terminal logging.
console.log = jest.fn()

// Set up RWJS_CWD.
let original_RWJS_CWD
const FIXTURE_PATH = '/redwood-app'

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Mock api dist functions.
jest.mock('fs', () => require('memfs').fs)

jest.mock(
  '/redwood-app/api/dist/functions/1/1.js',
  () => {
    return {
      handler: () => {},
    }
  },
  { virtual: true }
)

jest.mock(
  '\\redwood-app\\api\\dist\\functions\\1\\1.js',
  () => {
    return {
      handler: () => {},
    }
  },
  { virtual: true }
)

jest.mock(
  '/redwood-app/api/dist/functions/graphql.js',
  () => {
    return {
      handler: () => {},
    }
  },
  { virtual: true }
)

jest.mock(
  '\\redwood-app\\api\\dist\\functions\\graphql.js',
  () => {
    return {
      handler: () => {},
    }
  },
  { virtual: true }
)

test('loadFunctionsFromDist puts functions named with numbers before the graphql function', async () => {
  vol.fromNestedJSON(
    {
      'redwood.toml': '',
      api: {
        dist: {
          functions: {
            1: {
              '1.js': '',
            },
            'graphql.js': '',
          },
        },
      },
    },
    FIXTURE_PATH
  )

  expect(LAMBDA_FUNCTIONS).toEqual({})

  await loadFunctionsFromDist()

  expect(Object.keys(LAMBDA_FUNCTIONS)[0]).toEqual('1')
})
