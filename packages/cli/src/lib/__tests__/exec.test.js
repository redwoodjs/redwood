import { patchRequire } from 'fs-monkey'
import { vol, fs as mfs } from 'memfs'
import { vi, describe, beforeAll, afterAll, it, expect } from 'vitest'

import { runScriptFunction } from '../exec'

vi.mock('fs', () => mfs)
vi.mock('@redwoodjs/internal/dist/files', () => {
  return {
    resolveSourcePath: (sourcePath) => sourcePath,
  }
})

const redwoodProjectPath = '/redwood-app'
process.env.RWJS_CWD = redwoodProjectPath

describe('exec.js', () => {
  beforeAll(() => {
    patchRequire(vol)
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('runScriptFunction', () => {
    it('resolves and runs script with no extension', async () => {
      const expectedScriptReturn = Math.floor(Math.random() * 1000)
      // TODO: Figure out if we can use a syntax here that's closer to what a
      // user might actually write in their script file
      const fooScript = `
        module.exports = {
          default: ({ args }) => ${expectedScriptReturn}
        }
      `

      vol.fromJSON({ 'scripts/foo.js': fooScript }, redwoodProjectPath)

      await expect(
        runScriptFunction({
          path: `${redwoodProjectPath}/scripts/foo`,
          functionName: 'default',
          args: { args: undefined },
        })
      ).resolves.toBe(expectedScriptReturn)
    })

    it('resolves and runs script with .js extension', async () => {
      const expectedScriptReturn = Math.floor(Math.random() * 1000)
      const fooScript = `
        module.exports = {
          default: ({ args }) => ${expectedScriptReturn}
        }
      `

      vol.fromJSON({ 'scripts/fooExt.js': fooScript }, redwoodProjectPath)

      await expect(
        runScriptFunction({
          path: `${redwoodProjectPath}/scripts/fooExt.js`,
          functionName: 'default',
          args: { args: undefined },
        })
      ).resolves.toBe(expectedScriptReturn)
    })

    it('Picks .js over .json', async () => {
      const expectedScriptReturn = Math.floor(Math.random() * 1000)
      const fooScript = `
        module.exports = {
          default: ({ args }) => ${expectedScriptReturn}
        }
      `

      vol.fromJSON(
        {
          'scripts/fooExtJson.js': fooScript,
          'scripts/fooExtJson.json': '{ "big": "bang" }',
        },
        redwoodProjectPath
      )

      await expect(
        runScriptFunction({
          path: `${redwoodProjectPath}/scripts/fooExtJson.js`,
          functionName: 'default',
          args: { args: undefined },
        })
      ).resolves.toBe(expectedScriptReturn)
    })
  })
})
