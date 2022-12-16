import fs from 'fs-extra'

import { MOCK_HEROKU_CTX } from '../__mocks__/mock_ctx'
import { HEROKU_ERRORS } from '../interfaces'
import {
  validatePrereqs,
  _validateGit,
  _validatePostgresConfigured,
} from '../prereqs'
import { Questions } from '../questions'
import { spawn } from '../stdio'

jest.mock('../stdio')
jest.mock('fs-extra')
jest.mock('../questions')

beforeEach(() => {
  jest.resetAllMocks()
  global.process = { ...global.process, platform: 'darwin' }
})

describe('prerequisites for heroku deploy', () => {
  it('skips all checks when flag is set', async () => {
    await validatePrereqs({ ...MOCK_HEROKU_CTX, skipChecks: true })
    expect(MOCK_HEROKU_CTX.logger.debug).toHaveBeenCalledWith(
      'Skipping system checks...'
    )
  })

  it('fails on unsupported systems', async () => {
    global.process = { ...global.process, platform: 'win32' }
    await expect(validatePrereqs(MOCK_HEROKU_CTX)).rejects.toThrow(
      HEROKU_ERRORS.NO_SUPPORT
    )
  })

  it('fails when heroku is not installed', async () => {
    jest.mocked(spawn).mockResolvedValueOnce('')
    await expect(validatePrereqs(MOCK_HEROKU_CTX)).rejects.toThrow(
      HEROKU_ERRORS.NO_HEROKU
    )
  })
})

describe('postgres config', () => {
  it('should replace provider in schema.prisma to postgres', async () => {
    jest.mocked(fs.readFileSync).mockReturnValueOnce('provider = "sqlite"')
    jest.mocked(Questions.shouldEditSchema).mockResolvedValueOnce(true)

    await _validatePostgresConfigured(MOCK_HEROKU_CTX)

    const actual = jest.mocked(fs.writeFileSync).mock.calls[0][1]

    expect(actual).toEqual('provider = "postgresql"')
  })
})

describe('git checks', () => {
  it('should init new git repo', async () => {
    jest.mocked(spawn).mockResolvedValueOnce('')
    jest.mocked(Questions.shouldInitGit).mockResolvedValueOnce(true)

    await _validateGit(MOCK_HEROKU_CTX)

    expect(jest.mocked(spawn).mock.calls[1][0]).toEqual('git init')
  })
})
