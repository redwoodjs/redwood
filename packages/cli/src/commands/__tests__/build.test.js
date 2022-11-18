jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getPaths: () => {
      return {
        api: {
          dist: '/mocked/project/api/dist',
        },
        web: {
          dist: '/mocked/project/web/dist',
          routes: '/mocked/project/web/Routes.tsx',
        },
      }
    },
  }
})

jest.mock('@redwoodjs/internal/dist/config', () => {
  return {
    getConfig: () => {},
  }
})

import { Listr } from 'listr2'
jest.mock('listr2')

// Make sure prerender doesn't get triggered
jest.mock('execa', () =>
  jest.fn((cmd, params) => ({
    cmd,
    params,
  }))
)

import { handler } from '../build'

afterEach(() => jest.clearAllMocks())

test('the build tasks are in the correct sequence', async () => {
  await handler({})
  expect(Listr.mock.calls[0][0].map((x) => x.title)).toMatchInlineSnapshot(`
    [
      "Generating Prisma Client...",
      "Verifying graphql schema...",
      "Building API...",
      "Cleaning Web...",
      "Building Web...",
    ]
  `)
})

jest.mock('@redwoodjs/prerender/detection', () => {
  return { detectPrerenderRoutes: () => [] }
})

test('Should run prerender for web', async () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  await handler({ side: ['web'], prerender: true })
  expect(Listr.mock.calls[0][0].map((x) => x.title)).toMatchInlineSnapshot(`
    [
      "Cleaning Web...",
      "Building Web...",
    ]
  `)

  // Run prerendering task, but expect warning,
  // because `detectPrerenderRoutes` is empty.
  expect(consoleSpy.mock.calls[0][0]).toBe('Starting prerendering...')
  expect(consoleSpy.mock.calls[1][0]).toBe(
    'You have not marked any routes to "prerender" in your Routes (​file:///mocked/project/web/Routes.tsx​).'
  )
})
