import fs from 'fs'

import latestVersion from 'latest-version'

import { handler } from '../update'

import '../../lib/mockTelemetry'

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

describe('Upgrade is not available (1.0.0 -> 1.0.0)', () => {
  beforeEach(() => {
    latestVersion.mockImplementation(() => {
      return '1.0.0'
    })
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

    console.log = jest.fn()
  })

  test('No update message', async () => {
    await handler({})
    expect(console.log.mock.calls.length).toBe(0)
  })
})

describe('Upgrade is available (1.0.0 -> 2.0.0)', () => {
  beforeEach(() => {
    latestVersion.mockImplementation(() => {
      return '2.0.0'
    })
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

    console.log = jest.fn()
  })

  test('No update message', async () => {
    await handler({})
    expect(console.log.mock.calls.length).toBe(1)
    expect(console.log.mock.calls[0][0]).not.toBe(
      'An update command is already running, please try again in a few seconds.'
    )
  })
})
