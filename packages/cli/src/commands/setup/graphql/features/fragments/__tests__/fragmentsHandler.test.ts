let mockExecutedTaskTitles: Array<string> = []
let mockSkippedTaskTitles: Array<string> = []

console.log('mockity mock?')
jest.mock('fs', () => require('memfs').fs)
jest.mock('node:fs', () => require('memfs').fs)
jest.mock('execa')
// The jscodeshift parts are tested by another test
jest.mock('../runTransform', () => {
  return {
    runTransform: () => {
      return {}
    },
  }
})

jest.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: jest.fn().mockImplementation((tasks: Array<any>) => {
      return {
        run: async () => {
          mockExecutedTaskTitles = []
          mockSkippedTaskTitles = []

          for (const task of tasks) {
            const skip =
              typeof task.skip === 'function' ? task.skip : () => task.skip

            if (skip()) {
              mockSkippedTaskTitles.push(task.title)
            } else {
              mockExecutedTaskTitles.push(task.title)
              await task.task()
            }
          }
        },
      }
    }),
  }
})

import path from 'node:path'

import { vol } from 'memfs'

import { handler } from '../fragmentsHandler'

// Suppress terminal logging.
// console.log = jest.fn()

// Set up RWJS_CWD
let original_RWJS_CWD: string | undefined
const FIXTURE_PATH = '/redwood-app'

let testProjectAppTsx: string

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH

  const actualFs = jest.requireActual('fs')
  testProjectAppTsx = actualFs.readFileSync(
    path.join(
      __dirname,
      '../../../../../../../../../__fixtures__/test-project/web/src/App.tsx'
    ),
    'utf-8'
  )
})

beforeEach(() => {
  mockExecutedTaskTitles = []
  mockSkippedTaskTitles = []

  vol.reset()
  vol.fromNestedJSON(
    {
      'redwood.toml': '',
      web: {
        src: {
          'App.tsx': testProjectAppTsx,
        },
      },
    },
    FIXTURE_PATH
  )
})

afterEach(() => {
  mockExecutedTaskTitles = []
  mockSkippedTaskTitles = []
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
  jest.resetAllMocks()
  jest.resetModules()
})

test('`fragments = true` is added to redwood.toml', async () => {
  await handler({ force: false })

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toMatch(
    /fragments = true/
  )
})

test('all tasks are being called', async () => {
  await handler({ force: false })

  expect(mockExecutedTaskTitles).toMatchInlineSnapshot(`
    [
      "Update Redwood Project Configuration to enable GraphQL Fragments",
      "Generate possibleTypes.ts",
      "Import possibleTypes in App.tsx",
      "Add possibleTypes to the GraphQL cache config",
    ]
  `)
})

test('redwood.toml update is skipped if fragments are already enabled', async () => {
  vol.fromNestedJSON(
    {
      'redwood.toml': `
        [graphql]
          fragments = true
      `,
      web: {
        src: {
          'App.tsx': testProjectAppTsx,
        },
      },
    },
    FIXTURE_PATH
  )

  await handler({ force: false })

  expect(mockExecutedTaskTitles).toMatchInlineSnapshot(`
    [
      "Generate possibleTypes.ts",
      "Import possibleTypes in App.tsx",
      "Add possibleTypes to the GraphQL cache config",
    ]
  `)

  expect(mockSkippedTaskTitles).toMatchInlineSnapshot(`
    [
      "Update Redwood Project Configuration to enable GraphQL Fragments",
    ]
  `)
})

// Add test that checks all steps being called
