import { vol } from 'memfs'
import {
  vi,
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import { runScriptFunction as mockRunScriptFunction } from '../../lib/exec'
import { generatePrismaClient as mockGeneratePrismaClient } from '../../lib/generatePrismaClient'
import { handler } from '../execHandler'

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

vi.mock('@redwoodjs/project-config', () => {
  const path = require('path')
  const BASE_PATH = '/redwood-app'
  return {
    resolveFile: (path) => path,
    getPaths: () => {
      return {
        base: BASE_PATH,
        scripts: path.join(BASE_PATH, 'scripts'),
      }
    },
  }
})
vi.mock('fs', () => require('memfs').fs)
vi.mock('../../lib/exec')
vi.mock('../../lib/generatePrismaClient', () => {
  return {
    generatePrismaClient: vi.fn().mockResolvedValue(true),
  }
})
vi.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: vi.fn().mockImplementation((tasks) => {
      return {
        run: async () => {
          for (const task of tasks) {
            const skip =
              typeof task.skip === 'function' ? task.skip : () => task.skip

            if (!skip()) {
              await task.task()
            }
          }
        },
      }
    }),
  }
})

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('execHandler.js', () => {
  beforeEach(() => {
    vol.reset()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vol.reset()
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('handler', () => {
    it('resolves script without extension', async () => {
      const fooScript =
        'export default async ({ args }) => { console.log(`:: Executing script ${__filename} ::`) }'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': fooScript,
          },
        },
        redwoodProjectPath
      )

      await handler({ name: 'foo', prisma: true, arg1: 'a1', arg2: 'a2' })

      expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
      expect(mockRunScriptFunction).toHaveBeenCalledWith({
        path: '/redwood-app/scripts/foo',
        functionName: 'default',
        args: { args: { arg1: 'a1', arg2: 'a2' } },
      })
    })
  })
})
