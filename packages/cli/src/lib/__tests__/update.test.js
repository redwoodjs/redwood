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

const TESTING_CURRENT_DATETIME = 1640995200000

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

  it.only('A command does not show an upgrade message', async () => {
    const { stdout, stderr } = rw([
      '--cwd',
      path.join('__fixtures__', 'test-project'),
      'info',
    ])
    console.log({ stdout, stderr })
    expect(stdout).toBe('') // TODO: Need to ensure it does not contain an upgrade message
  })

  it.only('A command after a check does not show an upgrade message', async () => {
    await update.check()

    const { stdout, stderr } = rw([
      '--cwd',
      path.join('__fixtures__', 'test-project'),
      'info',
    ])

    console.log({ stdout, stderr })
    expect(stdout).toBe('') // TODO: Need to ensure it does not contain an upgrade message
  })
})
