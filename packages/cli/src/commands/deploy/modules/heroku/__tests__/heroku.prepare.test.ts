import fs from 'fs-extra'

import { MOCK_HEROKU_CTX } from '../__mocks__/mock_ctx'
import { Heroku } from '../api'
import { HEROKU_ERRORS } from '../interfaces'
import { prepareStep, TEMPLATES } from '../prepare'

global.process = { exit: jest.fn() } as any

jest.mock('../api')
jest.mock('fs-extra')
jest.mock('../stdio')
jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/'),
  dirname: jest.fn(),
}))
beforeEach(() => {
  jest.clearAllMocks()
})

describe('template copying', () => {
  it('copys all the templates to the correct locations', async () => {
    const projectPath = 'mock_project_path'
    const ctx = { ...MOCK_HEROKU_CTX, projectPath }

    await prepareStep(ctx)

    const actual = jest
      .mocked(fs.copyFileSync)
      .mock.calls.map((call) => call[1])

    const expected = TEMPLATES.map(
      (t) => `${projectPath}/${t.replace('.template', '')}`
    )
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(TEMPLATES.length)
    expect(actual).toEqual(expected)
  })

  it('replaces APP_NAME vars in templates', async () => {
    jest.mocked(fs.readFileSync).mockReturnValueOnce('APP_NAME')
    await prepareStep({ ...MOCK_HEROKU_CTX, appName: 'mock_app_name' })

    const actual = jest.mocked(fs.writeFileSync).mock.calls[0][1]

    expect(actual).toEqual('mock_app_name')
  })
})

describe('Heroku deploy prep', () => {
  it('throws if theres an issue finding project path', async () => {
    const ctx = { ...MOCK_HEROKU_CTX, projectPath: '' }
    await expect(prepareStep(ctx)).rejects.toThrowError(
      HEROKU_ERRORS.MISSING_PROJECT_PATH
    )
  })
})

describe('destroying via cli arg', () => {
  it('destroys app when flag is set', async () => {
    const ctx = {
      ...MOCK_HEROKU_CTX,
      delete: '',
    }
    await expect(prepareStep(ctx)).rejects.toThrowError(
      HEROKU_ERRORS.HANDLE_DELETE
    )
    const goodCtx = {
      ...ctx,
      delete: 'myapp',
    }
    jest.mocked(Heroku.destroy).mockResolvedValueOnce('myapp')

    await prepareStep(goodCtx)

    expect(Heroku.destroy).toHaveBeenCalled()
  })
  it('destroys default app when both --defaults and --delete exist', async () => {
    const ctx = {
      ...MOCK_HEROKU_CTX,
      delete: 'myapp',
      defaults: true,
    }
    jest.mocked(Heroku.destroy).mockResolvedValueOnce('fakeresponse')

    await prepareStep(ctx)

    expect(Heroku.destroy).toHaveBeenCalledWith(MOCK_HEROKU_CTX.appName)
  })
})
