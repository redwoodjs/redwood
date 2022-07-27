jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getPaths: () => {
      return {
        api: {
          dist: '/mocked/project/api/dist',
        },
        web: {
          dist: '/mocked/project/web/dist',
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

import Listr from 'listr'
jest.mock('listr', () => {
  return jest.fn().mockImplementation(function FakeListr() {
    return { run: jest.fn() }
  })
})

import { handler } from '../build'

afterEach(() => jest.clearAllMocks())

test('the build tasks are in the correct sequence', async () => {
  await handler({})
  expect(Listr.mock.calls[0][0].map((x) => x.title)).toMatchInlineSnapshot(`
Array [
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
  await handler({ side: ['web'], prerender: true })
  expect(Listr.mock.calls[0][0].map((x) => x.title)).toMatchInlineSnapshot(`
    Array [
      "Cleaning Web...",
      "Building Web...",
      "Prerendering Web...",
    ]
  `)
  // Run prerendering task, but expect failure,
  // because `detectPrerenderRoutes` is empty.
  const x = await Listr.mock.calls[0][0][2].task()
  expect(x.startsWith('You have not marked any "prerender" in your Routes'))
})
