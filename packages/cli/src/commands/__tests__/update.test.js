global.__dirname = __dirname

jest.mock('fs')
jest.mock('latest-version')

jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getConfigPath: () => '/mocked/project/redwood.toml',
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

import Enquirer from 'enquirer'
import latestVersion from 'latest-version'

import { handler } from '../update'

import '../../lib/mockTelemetry'

const CURRENT_DATETIME = Date.parse('2022-01-02T12:00:00.000Z')
const DEFAULT_DATETIME = Date.parse('2000-01-02T12:00:00.000Z')
const DEFAULT_UPDATE_DATA = {
  localVersion: '0.0.0',
  remoteVersion: '0.0.0',
  skipVersion: '0.0.0',
  upgradeAvailable: false,
  lastChecked: DEFAULT_DATETIME,
  lastShown: DEFAULT_DATETIME,
}

describe('Upgrade is not available (1.0.0 -> 1.0.0)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(CURRENT_DATETIME)
    latestVersion.mockImplementation(() => {
      return '1.0.0'
    })
    fs.__setMockFiles({
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),
      '.redwood/update-data.json': JSON.stringify(DEFAULT_UPDATE_DATA),
    })
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    jest.useRealTimers()
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  test('Unskip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: DEFAULT_UPDATE_DATA.localVersion,
      remoteVersion: DEFAULT_UPDATE_DATA.remoteVersion,
      skipVersion: '0.0.0',
      upgradeAvailable: DEFAULT_UPDATE_DATA.upgradeAvailable,
      lastChecked: DEFAULT_UPDATE_DATA.lastChecked,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Unskip produces correct file', async () => {
    await handler({ listr2: { rendererSilent: true } })
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '1.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: false,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Skip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual(DEFAULT_UPDATE_DATA)
  })

  test('Skip produces correct file', async () => {
    await handler({ listr2: { rendererSilent: true } })
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '1.0.0',
      skipVersion: '1.0.0',
      upgradeAvailable: false,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME,
    })
  })

  test('Shows correct final message', async () => {
    await handler({})
    const lastListr2Output =
      process.stdout.write.mock.calls[
        process.stdout.write.mock.calls.length - 1
      ][0]
    expect(lastListr2Output).toMatchSnapshot()
  })

  test('No output when silent flag is set', async () => {
    await handler({ silent: true })
    expect(process.stdout.write.mock.calls.length).toBe(0)
  })

  test('Does not prompt for upgrade', async () => {
    let didPrompt = false
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      didPrompt = true
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    expect(didPrompt).toBe(false)
  })

  test('Creates correct update-data.json file', async () => {
    await handler({ listr2: { rendererSilent: true } })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '1.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: false,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME,
    })
  })
})

// ----------------------------------------------------------------------------------------

describe('Upgrade is available (1.0.0 -> 2.0.0)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(CURRENT_DATETIME)
    latestVersion.mockImplementation(() => {
      return '2.0.0'
    })
    fs.__setMockFiles({
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),
      '.redwood/update-data.json': JSON.stringify(DEFAULT_UPDATE_DATA),
    })
    jest.spyOn(process.stdout, 'write')
  })

  afterEach(() => {
    jest.useRealTimers()
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  test('Unskip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: DEFAULT_UPDATE_DATA.localVersion,
      remoteVersion: DEFAULT_UPDATE_DATA.remoteVersion,
      skipVersion: '0.0.0',
      upgradeAvailable: DEFAULT_UPDATE_DATA.upgradeAvailable,
      lastChecked: DEFAULT_UPDATE_DATA.lastChecked,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Unskip produces correct file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Skip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual(DEFAULT_UPDATE_DATA)
  })

  test('Skip produces correct file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '2.0.0',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME, // current - minus 2 hours
    })
  })

  test('Shows correct final message', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({ enquirer: customEnquirer })
    const lastListr2Output =
      process.stdout.write.mock.calls[
        process.stdout.write.mock.calls.length - 1
      ][0]
    expect(lastListr2Output).toMatchSnapshot()
  })

  test('No output when silent flag is set', async () => {
    await handler({ silent: true })
    expect(process.stdout.write.mock.calls.length).toBe(0)
  })

  test('Does prompt for upgrade', async () => {
    let didPrompt = false
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      didPrompt = true
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    expect(didPrompt).toBe(true)
  })

  test('Creates correct update-data.json file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME,
    })
  })
})

// ----------------------------------------------------------------------------------------

describe('Upgrade is available (1.0.0-canary.100 -> 1.0.0-canary.200)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(CURRENT_DATETIME)
    latestVersion.mockImplementation(() => {
      return '1.0.0-canary.200'
    })
    fs.__setMockFiles({
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0-canary.100',
        },
      }),
      '.redwood/update-data.json': JSON.stringify(DEFAULT_UPDATE_DATA),
    })
    jest.spyOn(process.stdout, 'write')
  })

  afterEach(() => {
    jest.useRealTimers()
    fs.__setMockFiles({})
    jest.restoreAllMocks()
  })

  test('Unskip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: DEFAULT_UPDATE_DATA.localVersion,
      remoteVersion: DEFAULT_UPDATE_DATA.remoteVersion,
      skipVersion: '0.0.0',
      upgradeAvailable: DEFAULT_UPDATE_DATA.upgradeAvailable,
      lastChecked: DEFAULT_UPDATE_DATA.lastChecked,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Unskip produces correct file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    await handler({ listr2: { rendererSilent: true }, unskip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0-canary.100',
      remoteVersion: '1.0.0-canary.200',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME - 2 * 60 * 60_000, // current - minus 2 hours
    })
  })

  test('Skip produces correct file - no previous update', async () => {
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual(DEFAULT_UPDATE_DATA)
  })

  test('Skip produces correct file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    await handler({ listr2: { rendererSilent: true }, skip: true })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0-canary.100',
      remoteVersion: '1.0.0-canary.200',
      skipVersion: '1.0.0-canary.200',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME,
    })
  })

  test('Shows correct final message', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({ enquirer: customEnquirer })
    const lastListr2Output =
      process.stdout.write.mock.calls[
        process.stdout.write.mock.calls.length - 1
      ][0]
    expect(lastListr2Output).toMatchSnapshot()
  })

  test('No output when silent flag is set', async () => {
    await handler({ silent: true })
    expect(process.stdout.write.mock.calls.length).toBe(0)
  })

  test('Does prompt for upgrade', async () => {
    let didPrompt = false
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      didPrompt = true
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    expect(didPrompt).toBe(true)
  })

  test('Creates correct update-data.json file', async () => {
    const customEnquirer = new Enquirer({ show: false })
    customEnquirer.on('prompt', (prompt) => {
      prompt.value = false
      prompt.submit()
    })
    await handler({
      listr2: { rendererSilent: true },
      enquirer: customEnquirer,
    })
    const updateData = JSON.parse(fs.readFileSync('.redwood/update-data.json'))
    expect(updateData).toEqual({
      localVersion: '1.0.0-canary.100',
      remoteVersion: '1.0.0-canary.200',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: CURRENT_DATETIME,
      lastShown: CURRENT_DATETIME,
    })
  })
})
