import { vol } from 'memfs'

import { runScriptFunction as mockRunScriptFunction } from '../../lib/exec'
import { generatePrismaClient as mockGeneratePrismaClient } from '../../lib/generatePrismaClient'
import { handler } from '../execHandler'

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

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

jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'info').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})


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

      expect(mockGeneratePrismaClient).toHaveBeenCalledWith({ force: false })
      expect(mockRunScriptFunction).toHaveBeenCalledWith({
        path: '/redwood-app/scripts/foo',
        functionName: 'default',
        args: { args: { arg1: 'a1', arg2: 'a2' } },
      })
    })
  })
})
