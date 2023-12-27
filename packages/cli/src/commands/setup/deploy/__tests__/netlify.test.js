// Automock fs using ../..../__mocks__/fs
jest.mock('fs')

import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '../../../../lib'
import { updateApiURLTask } from '../helpers'
// Mock telemetry and other things
import '../../../../lib/test'

jest.mock('../../../../lib', () => {
  const path = jest.requireActual('path')

  const { printSetupNotes } = jest.requireActual('../../../../lib')

  return {
    printSetupNotes,
    getPaths: () => {
      return {
        base: path.resolve(
          path.join(
            __dirname,
            '../../../../../../../__fixtures__/example-todo-main'
          )
        ),
      }
    },
    getConfig: () => ({
      web: {
        port: 8910,
      },
    }),
    writeFilesTask: (fileNameToContentMap) => {
      const keys = Object.keys(fileNameToContentMap)
      expect(keys.length).toBe(1)
      // Need to escape path.sep on Windows, otherwise the backslash (that
      // path.sep is on Windows) together with the 'n' in "netlify" will be
      // interpreted as a new-line. And need to use double backslashes, so
      // that one "survives" into the regexp
      expect(keys[0]).toMatch(new RegExp(`\\${path.sep}netlify.toml$`))
      expect(fileNameToContentMap[keys[0]]).toMatchSnapshot()
    },
  }
})

const REDWOOD_TOML_PATH = path.join(getPaths().base, 'redwood.toml')

beforeEach(() => {
  fs.__setMockFiles({
    [REDWOOD_TOML_PATH]: `[web]
  title = "Redwood App"
  port = 8910
  apiUrl = "/.redwood/functions" # you can customize graphql and dbAuth urls individually too: see https://redwoodjs.com/docs/app-configuration-redwood-toml#api-paths
  includeEnvironmentVariables = [] # any ENV vars that should be available to the web side, see https://redwoodjs.com/docs/environment-variables#web
[api]
  port = 8911
[browser]
  open = true
`,
  })
})

describe('netlify', () => {
  it('should call the handler without error', async () => {
    const netlify = require('../providers/netlify')
    expect(async () => await netlify.handler({ force: true })).not.toThrow()
  })

  it('Should update redwood.toml apiUrl', () => {
    updateApiURLTask('/.netlify/functions').task()

    expect(fs.readFileSync(REDWOOD_TOML_PATH)).toMatch(
      /apiUrl = "\/.netlify\/functions"/
    )
  })

  it('should add netlify.toml', async () => {
    const netlify = require('../providers/netlify')
    await netlify.handler({ force: true })
    // Will be verified by a snapshot up above in the mocked `writeFilesTask`
  })
})
