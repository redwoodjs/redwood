global.__dirname = __dirname

import fs from 'fs'
import execa from 'execa'

import 'src/lib/test'
import * as path from 'path'
import * as lib from 'src/lib'
import initTailwind from '..'

jest.mock('fs')

const tailwindConfig = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, 'fixtures', 'tailwind.config.js'))
  .toString()

jest.mock('execa', () =>
  jest.fn((...args) => {
    const [cmd, cmdArgs] = args
    const mockExeca = require('./execa.mock').default
    mockExeca(cmd, cmdArgs)
  })
)

jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    getPaths: () => ({
      api: {},
      web: {
        base: 'some/path/to/web',
      },
    }),
    writeFile: jest.fn(),
  }
})

describe('rw setup tailwind - initTailwind task', () => {
  const configPath = path.join(lib.getPaths().web.base, 'tailwind.config.js')

  beforeEach(() => {
    jest.clearAllMocks()
    fs.__setMockFiles({})
  })

  describe('without the --force option', () => {
    const task = initTailwind({ force: false, ui: false })

    it('fails if TailwindCSS config already exists', async () => {
      fs.__setMockFiles({ [configPath]: 'anything' })

      const existsSpy = jest.spyOn(fs, 'existsSync')
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')

      // https://jestjs.io/docs/en/tutorial-async#error-handling
      expect.assertions(3)

      try {
        await task()
      } catch (e) {
        expect(e.message).toEqual(
          'TailwindCSS config already exists.\nUse --force to override existing config.'
        )
      }

      expect(existsSpy).toHaveBeenCalledWith(configPath)
      expect(writeFileSyncSpy).not.toHaveBeenCalled()
    })

    describe.each([
      /// ui, configLabel, configPresent
      [true],
      [false],
      ///
    ])('when --ui is set to %p and config is not present', (ui) => {
      testTailwindInit(false, ui, false)
    })
  })

  describe('with the --force option', () => {
    describe.each([
      /// ui, configLabel, configPresent
      [false, 'not present', false],
      [false, 'present', true],
      [true, 'present', true],
      [true, 'not present', false],
      ///
    ])('when --ui is set to %p and config is %s', (ui, _, configPresent) => {
      testTailwindInit(true, ui, configPresent)
    })
  })

  function testTailwindInit(force, ui, configPresent) {
    const task = initTailwind({ force, ui })

    if (configPresent) {
      fs.__setMockFiles({ [configPath]: tailwindConfig })
    }

    it('calls `yarn tailwindcss init`', async () => {
      await task()
      expect(execa).toHaveBeenCalledWith('yarn', ['tailwindcss', 'init'])
    })

    it('moves the config file to web/', async () => {
      await task()
      expect(fs.existsSync(configPath)).toBeTruthy()
    })

    it('un-comments future flags', async () => {
      const extractRegex = /future: {[^}]*},/g
      const futuresStr = tailwindConfig.match(extractRegex)[0]
      expect(futuresStr.length > 0).toBeTruthy()

      const futures = []
      for (let match of futuresStr.matchAll(/\/\/\s*([\w_-]+)\s*:\s*true/g)) {
        futures.push(match[1])
      }

      await task()

      const finalConfig = fs.readFileSync(configPath)
      const finalFutures = eval(
        `global.__futures = { ${finalConfig.match(extractRegex)[0]} }`
      ).future

      expect(Object.keys(finalFutures).length).toEqual(futures.length)
      expect(Object.keys(finalFutures).sort()).toEqual(futures.sort())
    })

    it('does not uncomment other flag-resembling lines', async () => {
      await task()

      const finalConfig = fs.readFileSync(configPath)
      expect(finalConfig).toContain('// thisMustNotBeUncommented: true')
      expect(finalConfig).toContain('// thisMustNotBeUncommented2: true')
    })

    if (ui) {
      it('adds the TailwindUI plugin to the config', async () => {
        await task()

        const finalConfig = fs.readFileSync(configPath)
        expect(finalConfig).toMatch(
          /plugins\s*:\s*\[[^\]]*require\('@tailwindcss\/ui'\)[^\]]*]/
        )
      })
    }
  }
})
