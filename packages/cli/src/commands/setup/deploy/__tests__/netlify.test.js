// Automock fs using ../..../__mocks__/fs
jest.mock('fs')

import fs from 'fs'
import path from 'path'

import { updateApiURLTask } from '../helpers'
// Mock telemetry and other things
import '../../../../lib/test'

jest.mock('../../../../lib', () => {
  const path = jest.requireActual('path')
  return {
    getPaths: () => {
      return {
        base: '../../../../../../../__fixtures__/example-todo-main',
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
      expect(keys[0]).toMatch(new RegExp(path.sep + 'netlify.toml$'))
      expect(fileNameToContentMap[keys[0]]).toMatchSnapshot()
    },
  }
})

const REDWOOD_TOML_PATH =
  '../../../../../../../__fixtures__/example-todo-main/redwood.toml'

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
