global.__dirname = __dirname

jest.mock('fs')
jest.mock('latest-version')

jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getConfigPath: () => '/mocked/project/redwood.toml',
    getPaths: () => {
      return {
        base: '',
      }
    },
  }
})

import fs from 'fs'

import latestVersion from 'latest-version'

import { handler } from '../update'

import '../../lib/mockTelemetry'

const DEFAULT_UPDATE_DATA_JSON = {
  localVersion: '0.0.0',
  remoteVersion: '0.0.0',
  skipVersion: '0.0.0',
  upgradeAvailable: false,
  lastChecked: 946684800000, // 2000-01-01T00:00:00.000Z
  lastShown: 946684800000, // 2000-01-01T00:00:00.000Z
}

// describe('Upgrade is not available (1.0.0 -> 1.0.0)', () => {
//   let consoleInfoSpy
//   beforeEach(() => {
//     jest.useFakeTimers()
//     jest.setSystemTime(Date.parse('2022-01-02T12:00:00.000Z'))
//     latestVersion.mockImplementation(() => {
//       return '1.0.0'
//     })
//     consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
//     console.log = jest.fn()
//     fs.__setMockFiles({
//       'package.json': JSON.stringify({
//         devDependencies: {
//           '@redwoodjs/core': '^1.0.0',
//         },
//       }),
//       '/tmp/.redwood/update-data.json': JSON.stringify(
//         DEFAULT_UPDATE_DATA_JSON
//       ),
//     })
//   })
//   afterEach(() => {
//     jest.useRealTimers()
//     fs.__setMockFiles({})
//     console.log.mockRestore()
//     consoleInfoSpy.mockClear()
//   })

//   test('Unskip produces correct file - no previous update', async () => {
//     await handler({ unskip: true })
//     const updateData = JSON.parse(
//       fs.readFileSync('/tmp/.redwood/update-data.json')
//     )
//     expect(updateData).toEqual({
//       localVersion: DEFAULT_UPDATE_DATA_JSON.localVersion,
//       remoteVersion: DEFAULT_UPDATE_DATA_JSON.remoteVersion,
//       skipVersion: '0.0.0',
//       upgradeAvailable: DEFAULT_UPDATE_DATA_JSON.upgradeAvailable,
//       lastChecked: DEFAULT_UPDATE_DATA_JSON.lastChecked,
//       lastShown: Date.parse('2022-01-02T10:00:00.000Z'),
//     })
//   })

//   test('Unskip produces correct file', async () => {
//     await handler({})
//     await handler({ unskip: true })
//     const updateData = JSON.parse(
//       fs.readFileSync('/tmp/.redwood/update-data.json')
//     )
//     expect(updateData).toEqual({
//       localVersion: '1.0.0',
//       remoteVersion: '1.0.0',
//       skipVersion: '0.0.0',
//       upgradeAvailable: false,
//       lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
//       lastShown: Date.parse('2022-01-02T10:00:00.000Z'),
//     })
//   })

//   test('Skip produces correct file - no previous update', async () => {
//     await handler({ skip: true })
//     const updateData = JSON.parse(
//       fs.readFileSync('/tmp/.redwood/update-data.json')
//     )
//     expect(updateData).toEqual(DEFAULT_UPDATE_DATA_JSON)
//   })

//   test('Skip produces correct file', async () => {
//     await handler({})
//     await handler({ skip: true })
//     const updateData = JSON.parse(
//       fs.readFileSync('/tmp/.redwood/update-data.json')
//     )
//     expect(updateData).toEqual({
//       localVersion: '1.0.0',
//       remoteVersion: '1.0.0',
//       skipVersion: '1.0.0',
//       upgradeAvailable: false,
//       lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
//       lastShown: Date.parse('2022-01-02T12:00:00.000Z'),
//     })
//   })

//   test('Silent has no output', async () => {
//     await handler({ silent: true })
//     expect(console.log).not.toHaveBeenCalled()
//   })

//   test('No update message', async () => {
//     await handler({})
//     expect(
//       console.log.mock.calls[console.log.mock.calls.length - 1][0]
//     ).toEqual(expect.stringContaining('No upgrade is available'))
//   })

//   test('Creates correct update-data.json file', async () => {
//     await handler({})
//     const updateData = JSON.parse(
//       fs.readFileSync('/tmp/.redwood/update-data.json')
//     )
//     expect(updateData).toEqual({
//       localVersion: '1.0.0',
//       remoteVersion: '1.0.0',
//       skipVersion: '0.0.0',
//       upgradeAvailable: false,
//       lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
//       lastShown: Date.parse('2022-01-02T12:00:00.000Z'),
//     })
//   })

//   test('Lock is created', async () => {
//     fs.writeFileSync = jest.fn()
//     await handler({})
//     expect(fs.writeFileSync.mock.calls[0][0]).toBe(
//       '/tmp/.redwood/locks/update-command'
//     )
//   })

//   test('Lock is removed', async () => {
//     fs.unlinkSync = jest.fn()
//     await handler({})
//     expect(fs.unlinkSync.mock.calls[0][0]).toBe(
//       '/tmp/.redwood/locks/update-command'
//     )
//   })
// })

describe('Upgrade is available (1.0.0 -> 2.0.0)', () => {
  let consoleInfoSpy
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.parse('2022-01-02T12:00:00.000Z'))
    latestVersion.mockImplementation(() => {
      return '2.0.0'
    })
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    console.log = jest.fn()
    fs.__setMockFiles({
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),
      '/tmp/.redwood/update-data.json': JSON.stringify(
        DEFAULT_UPDATE_DATA_JSON
      ),
    })
  })
  afterEach(() => {
    jest.useRealTimers()
    fs.__setMockFiles({})
    console.log.mockRestore()
    consoleInfoSpy.mockClear()
  })

  test('Unskip produces correct file - no previous update', async () => {
    await handler({ unskip: true })
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual({
      localVersion: DEFAULT_UPDATE_DATA_JSON.localVersion,
      remoteVersion: DEFAULT_UPDATE_DATA_JSON.remoteVersion,
      skipVersion: '0.0.0',
      upgradeAvailable: DEFAULT_UPDATE_DATA_JSON.upgradeAvailable,
      lastChecked: DEFAULT_UPDATE_DATA_JSON.lastChecked,
      lastShown: Date.parse('2022-01-02T10:00:00.000Z'),
    })
  })

  test('Unskip produces correct file', async () => {
    await handler({})
    await handler({ unskip: true })
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
      lastShown: Date.parse('2022-01-02T10:00:00.000Z'),
    })
  })

  test('Skip produces correct file - no previous update', async () => {
    await handler({ skip: true })
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual(DEFAULT_UPDATE_DATA_JSON)
  })

  test('Skip produces correct file', async () => {
    await handler({})
    await handler({ skip: true })
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '2.0.0',
      upgradeAvailable: true,
      lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
      lastShown: Date.parse('2022-01-02T12:00:00.000Z'),
    })
  })

  test('Silent has no output', async () => {
    await handler({ silent: true })
    expect(console.log).not.toHaveBeenCalled()
  })

  test('Shows update message', async () => {
    await handler({})
    expect(
      console.log.mock.calls[console.log.mock.calls.length - 1][0]
    ).toEqual(expect.stringContaining('Redwood Upgrade Available'))
  })

  test('Update message shows correct versions', async () => {
    await handler({})
    expect(
      console.log.mock.calls[console.log.mock.calls.length - 1][0]
    ).toEqual(expect.stringContaining('1.0.0 -> 2.0.0'))
  })

  test('Update message shows release notes link', async () => {
    await handler({})
    expect(
      console.log.mock.calls[console.log.mock.calls.length - 1][0]
    ).toEqual(
      expect.stringContaining('https://github.com/redwoodjs/redwood/releases')
    )
  })

  test('Update message shows upgrade command', async () => {
    await handler({})
    expect(
      console.log.mock.calls[console.log.mock.calls.length - 1][0]
    ).toEqual(expect.stringContaining('yarn rw upgrade'))
  })

  test('Creates correct update-data.json file', async () => {
    await handler({})
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual({
      localVersion: '1.0.0',
      remoteVersion: '2.0.0',
      skipVersion: '0.0.0',
      upgradeAvailable: true,
      lastChecked: Date.parse('2022-01-02T12:00:00.000Z'),
      lastShown: Date.parse('2022-01-02T12:00:00.000Z'),
    })
  })

  test('Lock is created', async () => {
    fs.writeFileSync = jest.fn()
    await handler({})
    expect(fs.writeFileSync.mock.calls[0][0]).toBe(
      '/tmp/.redwood/locks/update-command'
    )
  })

  test('Lock is removed', async () => {
    fs.unlinkSync = jest.fn()
    await handler({})
    expect(fs.unlinkSync.mock.calls[0][0]).toBe(
      '/tmp/.redwood/locks/update-command'
    )
  })
})

// describe('Lock already set', () => {
//   beforeEach(() => {
//     latestVersion.mockImplementation(() => {
//       return '1.0.0'
//     })
//     fs.__setMockFiles({
//       'package.json': JSON.stringify({
//         devDependencies: {
//           '@redwoodjs/core': '^1.0.0',
//         },
//       }),
//       '/tmp/.redwood/update-data.json': JSON.stringify({
//         skipVersion: '0.0.0',
//       }),
//       '/tmp/.redwood/locks/update-command': '',
//     })

//     console.log = jest.fn()
//   })

//   test('Locked message', async () => {
//     await handler({})
//     expect(console.log.mock.calls[console.log.mock.calls.length - 1][0]).toBe(
//       'An update command is already running, please try again in a few seconds.'
//     )
//   })

//   test('Silent has no output', async () => {
//     await handler({ silent: true })
//     expect(console.log.mock.calls.length).toBe(0)
//   })
// })
