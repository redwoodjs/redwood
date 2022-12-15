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

import { setLock } from '../locking'
import * as upgradeCheck from '../upgradeCheck'

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

      // We add in the default upgradeData.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      [path.join('.redwood', 'upgradeData.json')]: JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: upgradeCheck.DEFAULT_DATETIME_MS,
        shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct upgradeData.json file', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.readUpgradeDataFile()).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersion: '1.0.0',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(upgradeCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(upgradeCheck.shouldShow()).toBe(false)
  })

  it('Should not want to show after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldShow()).toBe(false)
  })

  it('Respects the lock', async () => {
    setLock(upgradeCheck.LOCK_IDENTIFIER)
    await expect(upgradeCheck.check()).rejects.toThrow(
      `Lock "${upgradeCheck.LOCK_IDENTIFIER}" is already set`
    )
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

      // We add in the default upgradeData.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      [path.join('.redwood', 'upgradeData.json')]: JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: upgradeCheck.DEFAULT_DATETIME_MS,
        shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct upgradeData.json file', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.readUpgradeDataFile()).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(upgradeCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(upgradeCheck.shouldShow()).toBe(false)
  })

  it('Should want to show after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldShow()).toBe(true)
  })

  it('Produces the correct upgrade message', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.getUpgradeMessage()).toMatch(
      /Redwood Upgrade Available: 1.0.0 -> 2.0.0/
    )
  })

  it('Outputs the correct upgrade message', async () => {
    const consoleMock = jest.spyOn(console, 'log').mockImplementation()
    await upgradeCheck.check()
    upgradeCheck.showUpgradeMessage()
    expect(console.log.mock.calls[0][0]).toMatch(
      /Redwood Upgrade Available: 1.0.0 -> 2.0.0/
    )
    consoleMock.mockRestore()
  })

  it('Respects the lock', async () => {
    setLock(upgradeCheck.LOCK_IDENTIFIER)
    await expect(upgradeCheck.check()).rejects.toThrow(
      `Lock "${upgradeCheck.LOCK_IDENTIFIER}" is already set`
    )
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

      // We add in the default upgradeData.json file otherwise we get "undefined" as the file contents when it doesn't exist - even though we do handle this case
      [path.join('.redwood', 'upgradeData.json')]: JSON.stringify({
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: upgradeCheck.DEFAULT_DATETIME_MS,
        shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct upgradeData.json file', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.readUpgradeDataFile()).toStrictEqual({
      localVersion: '1.0.0-rc.1',
      remoteVersion: '1.0.1-rc.58',
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: upgradeCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(upgradeCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(upgradeCheck.shouldShow()).toBe(false)
  })

  it('Should want to show after a check has run', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.shouldShow()).toBe(true)
  })

  it('Produces the correct upgrade message', async () => {
    await upgradeCheck.check()
    expect(upgradeCheck.getUpgradeMessage()).toMatch(
      /Redwood Upgrade Available: 1.0.0-rc.1 -> 1.0.1-rc.58/
    )
  })

  it('Outputs the correct upgrade message', async () => {
    const consoleMock = jest.spyOn(console, 'log').mockImplementation()
    await upgradeCheck.check()
    upgradeCheck.showUpgradeMessage()
    expect(console.log.mock.calls[0][0]).toMatch(
      /Redwood Upgrade Available: 1.0.0-rc.1 -> 1.0.1-rc.58/
    )
    consoleMock.mockRestore()
  })

  it('Respects the lock', async () => {
    setLock(upgradeCheck.LOCK_IDENTIFIER)
    await expect(upgradeCheck.check()).rejects.toThrow(
      `Lock "${upgradeCheck.LOCK_IDENTIFIER}" is already set`
    )
  })
})
