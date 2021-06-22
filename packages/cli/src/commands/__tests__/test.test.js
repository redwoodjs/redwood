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

  // Api tests need to run sequentially for scenarios
  expect(execa.mock.results[1].value.params).toContain('--runInBand')
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

test('Syncs or creates test database when the flag --db-push is set to true', async () => {
  await handler({
    filter: ['api'],
    dbPush: true,
  })

  expect(execa.mock.results[0].value).toEqual({
    cmd: 'yarn rw',
    params: ['prisma db push', '--force-reset', '--accept-data-loss'],
  })

  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')

  // Api tests need to run sequentially for scenarios
  expect(execa.mock.results[1].value.params).toContain('--runInBand')
})

test('Skips test database sync/creation when the flag --db-push is set to false', async () => {
  await handler({
    filter: ['api'],
    dbPush: false,
  })

  expect(execa.mock.results[0].value.cmd).toBe('yarn jest')
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

test('Runs tests specified side if even with additional filters', async () => {
  await handler({
    filter: ['web', 'bazinga'],
  })

  // Api side would have run prisma reset
  expect(execa.mock.results[0].value.cmd).not.toBe('yarn rw')
  expect(execa.mock.results[0].value.params).not.toContain('api')

  expect(execa.mock.results[0].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[0].value.params).toContain('bazinga')
  expect(execa.mock.results[0].value.params).toContain('web')
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

test('Passes other flags to jest', async () => {
  await handler({
    u: true,
    debug: true,
    json: true,
    collectCoverage: true,
  })

  // Second command because api side runs
  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')
  expect(execa.mock.results[1].value.params).toContain('-u')
  expect(execa.mock.results[1].value.params).toContain('--debug')
  expect(execa.mock.results[1].value.params).toContain('--json')
  expect(execa.mock.results[1].value.params).toContain('--collectCoverage')
})

test('Passes values of other flags to jest', async () => {
  await handler({
    bazinga: false,
    hello: 'world',
  })

  // Second command because api side runs
  expect(execa.mock.results[1].value.cmd).toBe('yarn jest')

  // Note that these below tests aren't the best, since they don't check for order
  // But I'm making sure only 2 extra params get passed
  expect(execa.mock.results[1].value.params).toEqual(
    expect.arrayContaining(['--bazinga', false])
  )

  expect(execa.mock.results[1].value.params).toEqual(
    expect.arrayContaining(['--hello', 'world'])
  )
})
