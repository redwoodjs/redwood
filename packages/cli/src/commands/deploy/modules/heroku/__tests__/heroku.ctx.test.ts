import fs from 'fs-extra'

import { MOCK_YARGS } from '../__mocks__/ctx'
import { HerokuApi } from '../api'
import { createContextStep } from '../ctx'
import { spawn } from '../stdio'

jest.mock('../../../../../lib')
jest.mock('../stdio')
jest.mock('fs-extra')
jest.mock('../api')

beforeEach(async () => {
  jest.resetAllMocks()
  jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit() was called')
  })
  Object.defineProperty(process, 'platform', {
    value: 'darwin',
  })
  Object.defineProperty(process, 'arch', {
    value: 'x64',
  })
})

describe('context', () => {
  it('creates a context', async () => {
    jest.mocked(HerokuApi.apps).mockResolvedValueOnce('badjson')

    const actual = await createContextStep(MOCK_YARGS)

    expect(actual.appName).toEqual('captain-crunch')
  })
})

describe('context system prereqs', () => {
  it('creates default context when flag is passed', async () => {
    jest.mocked(HerokuApi.apps).mockResolvedValueOnce(`{ "iamjson": "foobar"}`)

    const actual = await createContextStep({ ...MOCK_YARGS, defaults: true })

    expect(actual.prereqs?.isDarwin).toEqual(true)
  })

  it('destroys app when flag is passed', async () => {
    jest.mocked(HerokuApi.apps).mockResolvedValueOnce(`{ "iamjson": "foobar"}`)

    await expect(
      createContextStep({ ...MOCK_YARGS, destroy: 'killme' })
    ).rejects.toThrow('process.exit() was called')
  })

  it('creates prereqs based on system responses', async () => {
    jest.mocked(HerokuApi.apps).mockResolvedValueOnce(`{ "iamjson": "foobar"}`)
    jest.mocked(spawn).mockResolvedValueOnce('true').mockResolvedValueOnce('')
    jest.mocked(fs.readJsonSync).mockReturnValueOnce({ scripts: 'gotem' })
    jest
      .mocked(fs.readFileSync)
      .mockReturnValueOnce(``)
      .mockReturnValueOnce(`provider = "postgresql"`)

    const actual = await createContextStep(MOCK_YARGS)

    expect(actual.prereqs?.isDarwin).toEqual(true)
    expect(actual.prereqs?.isGitRepo).toEqual(true)
    expect(actual.prereqs?.isGitClean).toEqual(true)
    expect(actual.prereqs?.isPackageJsonClean).toEqual(false)
    expect(actual.prereqs?.isPrismaConfigured).toEqual(true)
  })
})
