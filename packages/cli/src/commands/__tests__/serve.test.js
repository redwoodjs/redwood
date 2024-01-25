globalThis.__dirname = __dirname

// We mock these to skip the check for web/dist and api/dist
vi.mock('@redwoodjs/project-config', async (importOriginal) => {
  const originalProjectConfig = await importOriginal()
  return {
    ...originalProjectConfig,
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
        api: {},
      }
    },
  }
})

vi.mock('fs-extra', async (importOriginal) => {
  const originalFsExtra = await importOriginal()
  return {
    default: {
      ...originalFsExtra,
      existsSync: (p) => {
        // Don't detect the experimental server file, can't use path.sep here so the replaceAll is used
        if (p.replaceAll('\\', '/') === '/mocked/project/api/dist/server.js') {
          return false
        }
        return true
      },
    },
  }
})

vi.mock('../serveApiHandler', async (importOriginal) => {
  const originalHandler = await importOriginal()
  return {
    ...originalHandler,
    apiServerHandler: vi.fn(),
  }
})
vi.mock('../serveBothHandler', async (importOriginal) => {
  const originalHandler = await importOriginal()
  return {
    ...originalHandler,
    bothServerHandler: vi.fn(),
  }
})
vi.mock('execa', () => ({
  default: vi.fn((cmd, params) => ({
    cmd,
    params,
  })),
}))

import execa from 'execa'
import { vi, describe, afterEach, it, expect } from 'vitest'
import yargs from 'yargs/yargs'

import { builder } from '../serve'
import { apiServerHandler } from '../serveApiHandler'
import { bothServerHandler } from '../serveBothHandler'

describe('yarn rw serve', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('Should proxy serve api with params to api-server handler', async () => {
    const parser = yargs().command('serve [side]', false, builder)

    await parser.parse('serve api --port 5555 --apiRootPath funkyFunctions')

    expect(apiServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5555,
        apiRootPath: expect.stringMatching(/^\/?funkyFunctions\/?$/),
      })
    )
  })

  it('Should proxy serve api with params to api-server handler (alias and slashes in path)', async () => {
    const parser = yargs().command('serve [side]', false, builder)

    await parser.parse(
      'serve api --port 5555 --rootPath funkyFunctions/nested/'
    )

    expect(apiServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5555,
        rootPath: expect.stringMatching(/^\/?funkyFunctions\/nested\/$/),
      })
    )
  })

  it('Should proxy rw serve with params to appropriate handler', async () => {
    const parser = yargs().command('serve [side]', false, builder)

    await parser.parse('serve --port 9898 --socket abc')

    expect(bothServerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 9898,
        socket: 'abc',
      })
    )
  })
})
