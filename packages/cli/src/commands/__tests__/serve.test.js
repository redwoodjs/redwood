jest.mock('@redwoodjs/internal', () => {
  return {
    getPaths: jest.fn(() => {
      return {
        base: '/mock/path',
        web: `/mock/path/web`,
      }
    }),
    processPagesDir: jest.fn(() => []),
  }
})

jest.mock('@redwoodjs/api-server', () => {
  return {
    handler: jest.fn(),
    options: {
      test: 'blah',
    },
  }
})

import { handler as apiServerHandler } from '@redwoodjs/api-server'

import { handler } from '../serve'

describe('yarn rw serve', () => {
  jest.mock('fs', () => {
    return {
      ...jest.requireActual('fs'),
      existsSync: () => true,
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should proxy the command with params to api-server handler', async () => {
    await handler({
      side: 'api',
      port: 5551,
      rootPath: '/rooty/mcRoot',
    })

    expect(apiServerHandler).toHaveBeenCalledWith({
      port: 5551,
      rootPath: '/rooty/mcRoot',
    })
  })
})
