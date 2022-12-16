import fs from 'fs-extra'

import { MOCK_YARGS } from '../__mocks__/mock_ctx'
import { HerokuApi } from '../api'
import { HerokuContext } from '../ctx'
import { spawn } from '../stdio'

jest.mock('../stdio')
jest.mock('../../../../../lib')
jest.mock('path')
jest.mock('../api')
jest.mock('fs-extra')

let heroku

beforeEach(async () => {
  jest.resetAllMocks()
  heroku = new HerokuContext(MOCK_YARGS)
})

describe('Core context', () => {
  it('Gathers base prereqs', async () => {
    jest.mocked(HerokuApi.init).mockResolvedValueOnce({ isUniqueName: true })
    jest.mocked(spawn).mockResolvedValueOnce('true').mockResolvedValueOnce('')

    jest
      .mocked(fs.readFileSync)
      .mockReturnValueOnce(`{ "scripts": { "start": "node run.js" } }`)
      .mockReturnValueOnce('provider = "postgresql"')

    await heroku.init()

    expect(heroku.prereqs.isGitClean).toEqual(true)
    expect(heroku.prereqs.isGitRepo).toEqual(true)
    expect(heroku.prereqs.isUniqueName).toEqual(true)
    expect(heroku.prereqs.isPackageJsonClean).toEqual(false)
    expect(heroku.prereqs.isPrismaConfigured).toEqual(true)
  })
})
