import fs from 'fs-extra'

import { MOCK_HEROKU_CTX } from '../__mocks__/ctx'
import { predeployStep } from '../predeploy'

global.process = { exit: jest.fn() } as any

jest.mock('../api')
jest.mock('fs-extra')
jest.mock('../stdio')
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  dirname: jest.fn().mockReturnValue('testfolder'),
}))
jest.mock('boxen')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('template copying', () => {
  it('copys all the templates to the correct locations with the correct interpolation', async () => {
    jest.mocked(fs.readFileSync).mockReturnValueOnce(`provider = "sqlite"`)

    jest
      .mocked(fs.readJsonSync)
      .mockReturnValue({ scripts: { oneScript: 'an existing script' } })

    jest.mocked(fs.copySync).mockImplementation(() => {})

    await predeployStep(MOCK_HEROKU_CTX)

    const copyCalls = jest.mocked(fs.copySync).mock.calls
    const jsonRead = jest.mocked(fs.readJsonSync).mock.calls
    const jsonWrite = jest.mocked(fs.writeJsonSync).mock.calls

    expect(copyCalls[0][1]).toEqual(
      'mock/project/path/config/ecosystem.config.js'
    )
    expect(copyCalls[1][1]).toEqual('mock/project/path/config/nginx.conf.erb')
    expect(copyCalls[2][1]).toEqual('mock/project/path/Procfile')
    expect(copyCalls[3][1]).toEqual('mock/project/path/scripts/build.sh')
    expect(copyCalls[4][1]).toEqual('mock/project/path/scripts/entrypoint.sh')
    expect(copyCalls[5][1]).toEqual('mock/project/path/scripts/postbuild.sh')
    expect(copyCalls[6][1]).toEqual('mock/project/path/scripts/start.js')

    expect(jsonWrite.length).toEqual(1)
    expect(jsonWrite[0][1].scripts.build).toEqual('./scripts/build.sh')

    expect(jsonRead[0][0]).toEqual('mock/project/path/package.json')
    expect(jsonRead.length).toEqual(1)

    const writeCalls = jest.mocked(fs.writeFileSync).mock.calls
    expect(writeCalls[0][1]).toEqual(`provider = \"postgresql\"`)
  })
})
