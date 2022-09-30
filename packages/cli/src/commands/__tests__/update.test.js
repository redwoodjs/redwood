import fs from 'fs'

import latestVersion from 'latest-version'

jest.mock('fs')
jest.mock('latest-version')

import '../../lib/mockTelemetry'
import { handler } from '../update'

jest.mock('../../lib', () => {
  return {
    getPaths: () => ({
      base: '',
    }),
  }
})

jest.mock('@redwoodjs/internal/dist/paths', () => {
  return {
    getConfigPath: () => '/mocked/project/redwood.toml',
    getPaths: () => {
      return {
        api: {
          dist: '/mocked/project/api/dist',
        },
        web: {
          dist: '/mocked/project/web/dist',
        },
        generated: {
          base: '/mocked/project/.redwood',
        },
      }
    },
  }
})

describe('No upgrade available', () => {
  beforeEach(() => {
    latestVersion.mockImplementation(() => {
      return '1.0.0'
    })
    Date.now = jest.fn(() => {
      return new Date('01/01/2022 12:00:00').getTime()
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
  })

  test('silent has no console output', async () => {
    console.log = jest.fn()
    await handler({ silent: true })
    expect(console.log).not.toHaveBeenCalled()
  })
})

describe('Upgrade available', () => {
  beforeEach(() => {
    latestVersion.mockImplementation(() => {
      return '2.0.0'
    })
    Date.now = jest.fn(() => {
      return new Date('01/01/2022 12:00:00').getTime()
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
  })

  test('silent has no console output', async () => {
    console.log = jest.fn()
    await handler({ silent: true })
    expect(console.log).not.toHaveBeenCalled()
  })

  test('has console output', async () => {
    console.log = jest.fn()
    await handler({})
    expect(console.log).toHaveBeenCalled()
  })
})
