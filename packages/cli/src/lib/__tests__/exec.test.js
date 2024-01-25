import { vol, fs as mfs } from 'memfs'
import { vi, describe, beforeEach, afterEach, afterAll } from 'vitest'

import { runScriptFunction } from '../exec'

vi.mock('fs', () => mfs)

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

describe('exec.js', () => {
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
