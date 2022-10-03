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

describe('Upgrade is not available (1.0.0 -> 1.0.0)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.parse('2022-01-02T12:00:00.000Z'))
    latestVersion.mockImplementation(() => {
      return '1.0.0'
    })
    console.log = jest.fn()
    fs.__setMockFiles({
      'package.json': JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '^1.0.0',
        },
      }),
      '/tmp/.redwood/update-data.json': JSON.stringify({
        skipVersion: '0.0.0',
      }),
    })
  })
  afterEach(() => {
    jest.useRealTimers()
    fs.__setMockFiles({})
    console.log.mockRestore()
  })

  test('Unskip produces correct file', async () => {
    await handler({ unskip: true })
    const updateData = JSON.parse(
      fs.readFileSync('/tmp/.redwood/update-data.json')
    )
    expect(updateData).toEqual({
      skipVersion: '0.0.0',
      lastShown: 1641117600000, // 2022-01-02T10:00:00.000Z
    })
  })

  // test('No update message', async () => {
  //   await handler({})
  //   expect(
  //     console.log.mock.calls[console.log.mock.calls.length - 1][0]
  //   ).toEqual(expect.stringContaining('No upgrade is available'))
  // })
})

// describe('Upgrade is available (1.0.0 -> 2.0.0)', () => {
//   beforeEach(() => {
//     latestVersion.mockImplementation(() => {
//       return '2.0.0'
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
//     })

//     console.log = jest.fn()
//   })

//   test('Correct update message', async () => {
//     await handler({})
//     expect(
//       console.log.mock.calls[console.log.mock.calls.length - 2][0]
//     ).toEqual(expect.stringContaining('New upgrade is available: 2.0.0'))

//     expect(
//       console.log.mock.calls[console.log.mock.calls.length - 1][0]
//     ).toEqual(
//       expect.stringContaining('Redwood Upgrade Available: 1.0.0 -> 2.0.0')
//     )
//   })
// })

// describe('Lock already set', () => {
//   beforeEach(() => {
//     latestVersion.mockImplementation(() => {
//       return '2.0.0'
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
