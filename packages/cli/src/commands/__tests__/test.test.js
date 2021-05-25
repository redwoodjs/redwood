global.__dirname = __dirname
import 'src/lib/test'

jest.mock('execa', () =>
  jest.fn((cmd, params) => ({
    cmd,
    params,
  }))
)
import execa from 'execa'

import { handler } from '../test'

jest.mock('@redwoodjs/structure', () => {
  return {
    getProject: () => ({
      sides: ['web', 'api'],
    }),
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

test('Creates/resets a test db when side has api, before calling jest', async () => {
  await handler({
    filter: ['api'],
  })

  expect(execa.mock.results[0].value).toEqual({
    cmd: 'yarn rw',
    params: ['prisma db push', '--force-reset', '--accept-data-loss'],
  })

  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')
})

test('Runs tests for all available sides if no filter passed', async () => {
  await handler({})

  // Api side runs db reset first
  expect(execa.mock.results[0].value).toEqual({
    cmd: 'yarn rw',
    params: ['prisma db push', '--force-reset', '--accept-data-loss'],
  })

  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[1].value.params).toContain('web')
  expect(execa.mock.results[1].value.params).toContain('api')
})

test('Runs tests for all available sides if no side filter passed', async () => {
  await handler({
    filter: ['bazinga'],
  })

  // Api side runs db reset first
  expect(execa.mock.results[0].value).toEqual({
    cmd: 'yarn rw',
    params: ['prisma db push', '--force-reset', '--accept-data-loss'],
  })

  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[1].value.params).toContain('bazinga')
  expect(execa.mock.results[1].value.params).toContain('web')
  expect(execa.mock.results[1].value.params).toContain('api')
})

test('Does not create db when calling test with just web', async () => {
  await handler({
    filter: ['web'],
  })

  expect(execa.mock.results[0].value.cmd).toBe('yarn jest')
})

test('Passes filter param to jest command if passed', async () => {
  await handler({
    filter: ['web', 'bazinga'],
  })

  expect(execa.mock.results[0].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[0].value.params).toContain('bazinga')
})

test('Passes relevant flags to jest', async () => {
  await handler({
    updateSnapshots: true,
    collectCoverage: true,
  })

  // Second command because api side runs
  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[1].value.params).toContain('-u')
  expect(execa.mock.results[1].value.params).toContain('--collectCoverage')
})
