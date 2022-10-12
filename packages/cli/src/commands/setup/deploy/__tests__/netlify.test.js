import fs from 'fs'
import path from 'path'

const FIXTURE_PATH = path.resolve(
  __dirname,
  './__fixtures__/example-netlify-deploy-project'
)

beforeAll(() => {
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
    const toml = fs.readFileSync(
      path.join(FIXTURE_PATH, 'netlify.toml'),
      'utf-8'
    )
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
