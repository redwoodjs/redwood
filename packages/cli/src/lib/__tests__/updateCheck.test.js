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
jest.mock('@redwoodjs/internal/dist/config', () => {
  return {
    ...jest.requireActual('@redwoodjs/internal/dist/config'),
    getConfig: () => {
      return {
        notifications: {
          versionUpdates: [],
        },
      }
    },
  }
})

import fs from 'fs'

import latestVersion from 'latest-version'

import { setLock } from '../locking'
import * as updateCheck from '../updateCheck'

const TESTING_CURRENT_DATETIME = 1640995200000

describe('Update is not available (1.0.0 -> 1.0.0)', () => {
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
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct updateData.json file', async () => {
    await updateCheck.check()
    const data = updateCheck.readUpdateDataFile()
    data.remoteVersions = Object.fromEntries(data.remoteVersions)
    expect(data).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersions: { '': '1.0.0' },
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: updateCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(updateCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(updateCheck.shouldShow()).toBe(false)
  })

  it('Should not want to show after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldShow()).toBe(false)
  })

  it('Respects the lock', async () => {
    setLock(updateCheck.LOCK_IDENTIFIER)
    await expect(updateCheck.check()).rejects.toThrow(
      `Lock "${updateCheck.LOCK_IDENTIFIER}" is already set`
    )
  })
})

describe('Update is available (1.0.0 -> 2.0.0)', () => {
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
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct updateData.json file', async () => {
    await updateCheck.check()
    const data = updateCheck.readUpdateDataFile()
    data.remoteVersions = Object.fromEntries(data.remoteVersions)
    expect(data).toStrictEqual({
      localVersion: '1.0.0',
      remoteVersions: { '': '2.0.0' },
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: updateCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(updateCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(updateCheck.shouldShow()).toBe(false)
  })

  it('Should want to show after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldShow()).toBe(true)
  })

  it.todo('Produces the correct update message')

  it('Respects the lock', async () => {
    setLock(updateCheck.LOCK_IDENTIFIER)
    await expect(updateCheck.check()).rejects.toThrow(
      `Lock "${updateCheck.LOCK_IDENTIFIER}" is already set`
    )
  })
})

describe('Update is available with rc tag (1.0.0-rc.1 -> 1.0.1-rc.58)', () => {
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
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  it('Produces the correct updateData.json file', async () => {
    await updateCheck.check()
    const data = updateCheck.readUpdateDataFile()
    data.remoteVersions = Object.fromEntries(data.remoteVersions)
    expect(data).toStrictEqual({
      localVersion: '1.0.0-rc.1',
      remoteVersions: { rc: '1.0.1-rc.58' },
      checkedAt: TESTING_CURRENT_DATETIME,
      shownAt: updateCheck.DEFAULT_DATETIME_MS,
    })
  })

  it('Should want to check before any check has run', () => {
    expect(updateCheck.shouldCheck()).toBe(true)
  })

  it('Should not want to check after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldCheck()).toBe(false)
  })

  it('Should not want to show before any check has run', () => {
    expect(updateCheck.shouldShow()).toBe(false)
  })

  it('Should want to show after a check has run', async () => {
    await updateCheck.check()
    expect(updateCheck.shouldShow()).toBe(true)
  })

  it.todo('Produces the correct update message')

  it('Respects the lock', async () => {
    setLock(updateCheck.LOCK_IDENTIFIER)
    await expect(updateCheck.check()).rejects.toThrow(
      `Lock "${updateCheck.LOCK_IDENTIFIER}" is already set`
    )
  })
})
