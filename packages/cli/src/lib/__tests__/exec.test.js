import { vol } from 'memfs'

import { runScriptFunction } from '../exec'

jest.mock('fs', () => require('memfs').fs)

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

describe('exec.js', () => {
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

  describe('runScriptFunction', () => {
    it('resolves and runs script with no extension', async () => {
      const expectedScriptReturn = Math.floor(Math.random() * 1000)
      const fooScript = `
        default async ({ args }) => ${expectedScriptReturn}
        module.exports = default
      `

      vol.fromNestedJSON(
        {
          'redwood.toml': '',
          scripts: {
            'foo.js': fooScript,
          },
        },
        redwoodProjectPath
      )

      // NOTE: this test currently fails with:
      // "Error: Cannot find module '/redwood-app/scripts/foo.js' from 'src/lib/exec.js'"
      await expect(
        runScriptFunction({
          path: '/redwood-app/scripts/foo',
          functionName: 'default',
        })
      ).resolves.toBe(expectedScriptReturn)
    })
  })
})
