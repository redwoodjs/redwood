let mockExecutedTaskTitles: string[] = []
let mockSkippedTaskTitles: string[] = []

vi.mock('fs', async () => {
  const memfs = await import('memfs')
  return {
    ...memfs.fs,
    default: {
      ...memfs.fs,
    },
  }
})
vi.mock('node:fs', async () => {
  const memfs = await import('memfs')
  return {
    ...memfs.fs,
    default: {
      ...memfs.fs,
    },
  }
})
vi.mock('execa')
// The jscodeshift parts are tested by another test
vi.mock('../../../../../../lib/runTransform', () => {
  return {
    runTransform: () => {
      return {}
    },
  }
})

vi.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: vi.fn().mockImplementation((tasks: any[]) => {
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

import { vol } from 'memfs'
import { vi, beforeAll, afterAll, test, expect } from 'vitest'

import { handler } from '../fragmentsHandler'

// Set up RWJS_CWD
let original_RWJS_CWD: string | undefined
const FIXTURE_PATH = '/redwood-app'

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
  vi.resetAllMocks()
  vi.resetModules()
})

test('all tasks are being called', async () => {
  vol.fromJSON({ 'redwood.toml': '', 'web/src/App.tsx': '' }, FIXTURE_PATH)

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
  vol.fromJSON(
    {
      'redwood.toml': '[graphql]\nfragments = true',
      'web/src/App.tsx': '',
    },
    FIXTURE_PATH,
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

test('redwood.toml update is skipped if fragments are already enabled, together with other settings', async () => {
  const toml = `
[graphql]
foo = "bar"
fragments = true
`
  vol.fromJSON({ 'redwood.toml': toml, 'web/src/App.tsx': '' }, FIXTURE_PATH)

  await handler({ force: false })

  expect(mockSkippedTaskTitles).toMatchInlineSnapshot(`
    [
      "Update Redwood Project Configuration to enable GraphQL Fragments",
    ]
  `)

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toEqual(toml)
})

test('redwood.toml is updated even if `fragments = true` exists for other sections', async () => {
  const toml = `
[notGraphql]
  fragments = true
`
  vol.fromJSON({ 'redwood.toml': toml, 'web/src/App.tsx': '' }, FIXTURE_PATH)

  await handler({ force: false })

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toEqual(
    toml + '\n[graphql]\n  fragments = true',
  )
})

test('`fragments = true` is added to existing [graphql] section', async () => {
  const toml = `
[graphql]

  isAwesome = true

[browser]
  open = true
`
  vol.fromJSON({ 'redwood.toml': toml, 'web/src/App.tsx': '' }, FIXTURE_PATH)

  await handler({ force: false })

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toEqual(`
[graphql]

  isAwesome = true
  fragments = true

[browser]
  open = true
`)
})

test("`fragments = true` is not indented if other settings aren't", async () => {
  const toml = `
[graphql]
isAwesome = true

[browser]
open = true
`
  vol.fromJSON({ 'redwood.toml': toml, 'web/src/App.tsx': '' }, FIXTURE_PATH)

  await handler({ force: false })

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toEqual(`
[graphql]
isAwesome = true
fragments = true

[browser]
open = true
`)
})

test('[graphql] is last section in redwood.toml', async () => {
  const toml = `
[graphql]
  isAwesome = true`

  vol.fromJSON({ 'redwood.toml': toml, 'web/src/App.tsx': '' }, FIXTURE_PATH)

  await handler({ force: false })

  expect(vol.toJSON()[FIXTURE_PATH + '/redwood.toml']).toEqual(
    toml + '\n  fragments = true',
  )
})
