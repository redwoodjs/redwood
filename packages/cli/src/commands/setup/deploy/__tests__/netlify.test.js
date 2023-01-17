// Automock fs using ../..../__mocks__/fs
jest.mock('fs')

import fs from 'fs'
import path from 'path'

const FIXTURE_PATH = path.resolve(
  __dirname,
  './__fixtures__/example-netlify-deploy-project'
)

// const t = `[web]
//   title = "Redwood App"
//   port = 8910
//   apiUrl = "/.redwood/functions" # you can customize graphql and dbauth urls individually too: see https://redwoodjs.com/docs/app-configuration-redwood-toml#api-paths
//   includeEnvironmentVariables = [] # any ENV vars that should be available to the web side, see https://redwoodjs.com/docs/environment-variables#web
// [api]
//   port = 8911
// [browser]
// open = true`

beforeAll(() => {
  // fs.writeFileSync(`${FIXTURE_PATH}/redwood.toml`, t)
  // fs.writeFileSync(`${FIXTURE_PATH}/netlify.toml`, t)
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  delete process.env.RWJS_CWD
})

describe('netlify', () => {
  it('should call the handler without error', async () => {
    const netlify = require('../providers/netlify')
    expect(async () => await netlify.handler({ force: true })).not.toThrow()
  })

  it('should generate a netlify.toml', async () => {
    const netlify = require('../providers/netlify')
    await netlify.handler({ force: true })
    const toml = fs.readFileSync(path.join(FIXTURE_PATH, 'netlify.toml'))

    console.log(toml)

    expect(toml).toMatchSnapshot()
  })

  it('should update redwood.toml apiUrl', async () => {
    const netlify = require('../providers/netlify')
    await netlify.handler({ force: true })
    const toml = fs.readFileSync(
      path.join(FIXTURE_PATH, 'redwood.toml'),
      'utf-8'
    )
    expect(toml).toMatchSnapshot()
  })
})
