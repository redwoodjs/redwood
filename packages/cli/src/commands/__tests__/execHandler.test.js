import { vol } from 'memfs'

import { runScriptFunction as mockRunScriptFunction } from '../../lib/exec'
import { generatePrismaClient as mockGeneratePrismaClient } from '../../lib/generatePrismaClient'
import { handler } from '../execHandler'

jest.mock('fs', () => require('memfs').fs)
jest.mock('../../lib/exec')
jest.mock('../../lib/generatePrismaClient', () => {
  return {
    generatePrismaClient: jest.fn().mockResolvedValue(true),
  }
})
jest.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: jest.fn().mockImplementation((tasks) => {
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

// since process.exit() is used in execHandler for control flow, need to simulate it
// being called without actually letting it kill the process
const mockExit = jest.spyOn(process, 'exit').mockImplementation((number) => {
  throw new Error(`process.exit(${number})`)
})
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'info').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

describe('execHandler.js', () => {
  beforeEach(() => {
    vol.reset()
    jest.clearAllMocks()
  })

  afterEach(() => {
    vol.reset()
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
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

      expect(mockExit).not.toHaveBeenCalled()
      expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
      expect(mockRunScriptFunction).toHaveBeenCalledWith({
        path: '/redwood-app/scripts/foo',
        functionName: 'default',
        args: { args: { arg1: 'a1', arg2: 'a2' } },
      })
    })

    it('resolves script without extension when similarly named non-script files are present', async () => {
      const fooScript =
        'export default async ({ args }) => { console.log(`:: Executing script ${__filename} ::`) }'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.ts': fooScript,
            'foo.json': '{"should": "not conflict with resolving foo.ts"}',
          },
        },
        redwoodProjectPath
      )

      await handler({ name: 'foo', prisma: true, arg1: 'a1', arg2: 'a2' })

      expect(mockExit).not.toHaveBeenCalled()
      expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
      expect(mockRunScriptFunction).toHaveBeenCalledWith({
        path: '/redwood-app/scripts/foo',
        functionName: 'default',
        args: { args: { arg1: 'a1', arg2: 'a2' } },
      })
    })

    it('stops for non-matching script with no extension', async () => {
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

      await expect(
        handler({ name: 'fooDoesNotExist', prisma: true })
      ).rejects.toThrow('process.exit(1)')

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockGeneratePrismaClient).not.toHaveBeenCalled()
      expect(mockRunScriptFunction).not.toHaveBeenCalled()
    })

    it('stops for non-existing script with extension', async () => {
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

      await expect(handler({ name: 'foo.tsx', prisma: true })).rejects.toThrow(
        'process.exit(1)'
      )

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockGeneratePrismaClient).not.toHaveBeenCalled()
      expect(mockRunScriptFunction).not.toHaveBeenCalled()
    })

    it('resolves script with extension', async () => {
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

      await handler({ name: 'foo.js', prisma: true, arg1: 'a1', arg2: 'a2' })

      expect(mockExit).not.toHaveBeenCalled()
      expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
      expect(mockRunScriptFunction).toHaveBeenCalledWith({
        path: '/redwood-app/scripts/foo.js',
        functionName: 'default',
        args: { args: { arg1: 'a1', arg2: 'a2' } },
      })
    })

    it('resolves script with extension when similarly named scripts are present', async () => {
      const fooScript =
        'export default async ({ args }) => { console.log(`:: Executing script ${__filename} ::`) }'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': fooScript,
            'foo.jsx': fooScript,
            'foo.ts': fooScript,
            'foo.tsx': fooScript,
          },
        },
        redwoodProjectPath
      )

      for (const ext of ['js', 'jsx', 'ts', 'tsx']) {
        jest.clearAllMocks()

        await handler({ name: `foo.${ext}`, prisma: true })

        expect(mockExit).not.toHaveBeenCalled()
        expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
        expect(mockRunScriptFunction).toHaveBeenCalledWith({
          path: `/redwood-app/scripts/foo.${ext}`,
          functionName: 'default',
          args: { args: {} },
        })
      }
    })

    it('identifies ambiguously named files without extension', async () => {
      const fooScript =
        'export default async ({ args }) => { console.log(`:: Executing script ${__filename} ::`) }'

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': fooScript,
            'foo.ts': fooScript,
          },
        },
        redwoodProjectPath
      )

      await expect(handler({ name: 'foo', prisma: true })).rejects.toThrow(
        'process.exit(1)'
      )

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockGeneratePrismaClient).not.toHaveBeenCalled()
      expect(mockRunScriptFunction).not.toHaveBeenCalled()
    })
  })
})
