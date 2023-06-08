globalThis.__dirname = __dirname

// We mock these to skip the check for web/dist and api/dist
jest.mock('@redwoodjs/project-config', () => {
  return {
    getPaths: () => {
      return {
        api: {
          base: '/mocked/project/api',
          dist: '/mocked/project/api/dist',
        },
        web: {
          base: '/mocked/project/web',
          dist: '/mocked/project/web/dist',
        },
      }
    },
    getConfig: () => {
      return {
        web: {
          host: 'localhost',
        },
        api: {
          host: 'localhost',
        },
      }
    },
  }
})

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    existsSync: (p) => {
      // Don't detect the experimental server file, can't use path.sep here so the replaceAll is used
      if (p.replaceAll('\\', '/') === '/mocked/project/api/dist/server.js') {
        return false
      }
      return true
    },
  }
})

jest.mock('../serveHandler', () => {
  return {
    ...jest.requireActual('../serveHandler'),
    apiServerHandler: jest.fn(),
    webServerHandler: jest.fn(),
    bothServerHandler: jest.fn(),
  }
})

import yargs from 'yargs'

import { builder } from '../serve'
import {
  apiServerHandler,
  bothServerHandler,
  webServerHandler,
} from '../serveHandler'

describe('yarn rw serve', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should proxy serve api with params to api-server handler', async () => {
    const parser = yargs.command('serve [side]', false, builder)

    await parser.parse('serve api --port 5555 --apiRootPath funkyFunctions')

    expect(apiServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5555,
        host: 'localhost',
        apiRootPath: expect.stringMatching(/^\/?funkyFunctions\/?$/),
      })
    )
  })

  it('Should proxy serve api with params to api-server handler (alias and slashes in path)', async () => {
    const parser = yargs.command('serve [side]', false, builder)

    await parser.parse(
      'serve api --port 5555 --rootPath funkyFunctions/nested/'
    )

    expect(apiServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5555,
        host: 'localhost',
        rootPath: expect.stringMatching(/^\/?funkyFunctions\/nested\/$/),
      })
    )
  })

  it('Should proxy serve web with params to web server handler', async () => {
    const parser = yargs.command('serve [side]', false, builder)

    await parser.parse(
      'serve web --port 9898 --socket abc --apiHost https://myapi.redwood/api'
    )

    expect(webServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 9898,
        host: 'localhost',
        socket: 'abc',
        apiHost: 'https://myapi.redwood/api',
      })
    )
  })

  it('Should proxy rw serve with params to appropriate handler', async () => {
    const parser = yargs.command('serve [side]', false, builder)

    await parser.parse('serve --port 9898 --socket abc')

    expect(bothServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 9898,
        host: 'localhost',
        socket: 'abc',
      })
    )
  })
})
