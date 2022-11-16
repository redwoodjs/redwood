global.__dirname = __dirname

jest.mock('fs')
jest.mock('latest-version')

jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    ...jest.requireActual('@redwoodjs/internal/dist/paths'),
    getPaths: () => {
      return {
        generated: {
          base: '.redwood',
        },
        base: '',
      }
    },
  }
})

import fs from 'fs'
import path from 'path'

import latestVersion from 'latest-version'

import { rw } from '../../__tests__/cwd.test'
import { setLock } from '../locking'
import * as update from '../update'

const realfs = jest.requireActual('fs')

const TESTING_CURRENT_DATETIME = 1640995200000
const TEST_PROJECT_UPDATE_DATA_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__',
  'test-project',
  '.redwood',
  'update-data.json'
)

describe('Upgrade is not available (1.0.0 -> 1.0.0)', () => {
  beforeAll(() => {
    // Use fake datetime
    jest.useFakeTimers()
    jest.setSystemTime(new Date(TESTING_CURRENT_DATETIME))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    // Set the fake remote version
    latestVersion.mockImplementation(() => {
      return '1.0.0'
    })

    fs.__setMockFiles({
      // Users package.json containing the redwood version
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),

      // We add in the default update-data.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      '.redwood/update-data.json': JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: update.DEFAULT_DATETIME_MS,
        shownAt: update.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct update-data.json file', async () => {
    await update.check()
    expect(update.readUpdateFile()).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersion: '1.0.0',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: update.DEFAULT_DATETIME_MS,
    })
  })

  it('Respects the lock', async () => {
    setLock(update.LOCK_IDENTIFIER)
    await expect(update.check()).rejects.toThrow(
      `Lock "${update.LOCK_IDENTIFIER}" is already set`
    )
  })

  it('A command does not show an upgrade message', async () => {
    realfs.writeFileSync(
      TEST_PROJECT_UPDATE_DATA_PATH,
      JSON.stringify({
        localVersion: '1.0.0',
        remoteVersion: '1.0.0',
        checkedAt: Date.now(),
        shownAt: update.DEFAULT_DATETIME_MS,
      })
    )
    const { stdout, _ } = rw([
      '--cwd',
      path.join('__fixtures__', 'test-project'),
      'info',
    ])
    expect(stdout).not.toMatch(/Redwood Upgrade Available: 1.0.0/)
  })
})

describe('Upgrade is available (1.0.0 -> 2.0.0)', () => {
  beforeAll(() => {
    // Use fake datetime
    jest.useFakeTimers()
    jest.setSystemTime(new Date(TESTING_CURRENT_DATETIME))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    // Set the fake remote version
    latestVersion.mockImplementation(() => {
      return '2.0.0'
    })

    fs.__setMockFiles({
      // Users package.json containing the redwood version
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),

      // We add in the default update-data.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      '.redwood/update-data.json': JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: update.DEFAULT_DATETIME_MS,
        shownAt: update.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct update-data.json file', async () => {
    await update.check()
    expect(update.readUpdateFile()).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: update.DEFAULT_DATETIME_MS,
    })
  })

  it('Respects the lock', async () => {
    setLock(update.LOCK_IDENTIFIER)
    await expect(update.check()).rejects.toThrow(
      `Lock "${update.LOCK_IDENTIFIER}" is already set`
    )
  })

  it('A command does show an upgrade message', async () => {
    realfs.writeFileSync(
      TEST_PROJECT_UPDATE_DATA_PATH,
      JSON.stringify({
        localVersion: '1.0.0',
        remoteVersion: '2.0.0',
        checkedAt: Date.now(),
        shownAt: update.DEFAULT_DATETIME_MS,
      })
    )
    const { stdout, _ } = rw([
      '--cwd',
      path.join('__fixtures__', 'test-project'),
      'info',
    ])
    expect(stdout).toMatch(/Redwood Upgrade Available: 1.0.0 -> 2.0.0/)
  })
})

describe('Upgrade is available with rc tag (1.0.0-rc.1 -> 1.0.1-rc.58)', () => {
  beforeAll(() => {
    // Use fake datetime
    jest.useFakeTimers()
    jest.setSystemTime(new Date(TESTING_CURRENT_DATETIME))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    // Set the fake remote version
    latestVersion.mockImplementation(() => {
      return '1.0.1-rc.58'
    })

    fs.__setMockFiles({
      // Users package.json containing the redwood version
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0-rc.1',
        },
      }),

      // We add in the default update-data.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      '.redwood/update-data.json': JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: update.DEFAULT_DATETIME_MS,
        shownAt: update.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct update-data.json file', async () => {
    await update.check()
    expect(update.readUpdateFile()).toStrictEqual({
      localVersion: '1.0.0-rc.1',
      remoteVersion: '1.0.1-rc.58',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: update.DEFAULT_DATETIME_MS,
    })
  })

  it('Respects the lock', async () => {
    setLock(update.LOCK_IDENTIFIER)
    await expect(update.check()).rejects.toThrow(
      `Lock "${update.LOCK_IDENTIFIER}" is already set`
    )
  })

  it('A command does show an upgrade message', async () => {
    realfs.writeFileSync(
      TEST_PROJECT_UPDATE_DATA_PATH,
      JSON.stringify({
        localVersion: '1.0.0-rc.1',
        remoteVersion: '1.0.1-rc.58',
        checkedAt: Date.now(),
        shownAt: update.DEFAULT_DATETIME_MS,
      })
    )
    const { stdout, _ } = rw([
      '--cwd',
      path.join('__fixtures__', 'test-project'),
      'info',
    ])
    expect(stdout).toMatch(
      /Redwood Upgrade Available: 1.0.0-rc.1 -> 1.0.1-rc.58/
    )
  })
})
