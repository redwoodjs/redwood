global.__dirname = __dirname

import fs from 'fs'

import 'src/lib/test'
import * as path from 'path'
import * as lib from 'src/lib'
import configurePostCSS from '..'

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    // readFileSync: () => '',
    existsSync: jest.fn(() => false),
  }
})

jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    getPaths: () => ({
      api: {},
      web: {
        postcss: 'some/path/to/postcss.config.js',
      },
    }),
    writeFile: jest.fn(),
  }
})

describe('rw setup tailwind - configurePostCSS task', () => {
  const configTemplate = fs
    .readFileSync(path.join(__dirname, '..', 'postcss.config.template.js'))
    .toString()

  describe('without the --force option', () => {
    const task = configurePostCSS({ force: false })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('fails if PostCSS config already exists', () => {
      fs.existsSync.mockImplementation(() => true)

      const expectedError =
        'PostCSS config already exists.\nUse --force to override existing config.'
      expect(task).toThrowError(expectedError)
      expect(fs.existsSync).toHaveBeenCalledWith(lib.getPaths().web.postcss)

      fs.existsSync.mockImplementation(() => false)
    })

    it('writes the PostCSS config file when it is not present', () => {
      task()
      expect(lib.writeFile).toHaveBeenCalledWith(
        lib.getPaths().web.postcss,
        configTemplate,
        { overwriteExisting: false }
      )
    })
  })

  describe('with the --force option', () => {
    const task = configurePostCSS({ force: true })

    describe.each([
      /// testLabel, fileExists
      ['exists', true],
      ['does not exist', false],
      ///
    ])('when a PostCSS file %s', (testLabel, fileExists) => {
      const testLabelMap = {
        true: 'overwrites',
        false: 'writes',
      }

      it(`${testLabelMap[fileExists]} the config file from template`, () => {
        fs.existsSync.mockImplementation(() => fileExists)

        task()

        expect(lib.writeFile).toHaveBeenCalledWith(
          lib.getPaths().web.postcss,
          configTemplate,
          { overwriteExisting: true }
        )
      })
    })
  })
})
