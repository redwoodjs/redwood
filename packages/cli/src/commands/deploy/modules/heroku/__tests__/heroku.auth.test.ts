import prompts from 'prompts'

import { MOCK_ERR_NOT_AUTHED, MOCK_HEROKU_CTX } from '../__fixtures__'
import { authHerokuTask } from '../auth'
import { HEROKU_ERRORS } from '../interfaces'
import { spawn } from '../stdio'

jest.mock('prompts')
jest.mock('../stdio')
jest.mock('fs')
jest.mock('../../../../../lib')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Unhappy heroku authentication paths', () => {
  it('trys to login when user isnt already', async () => {
    jest
      .mocked(spawn)
      .mockResolvedValueOnce({
        stderr: ' ›   Error: not logged in',
        exitCode: 100,
      })
      .mockResolvedValueOnce({
        stdout: 'success login',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'imanewuser@email.com',
        exitCode: 0,
      })
    await authHerokuTask(MOCK_HEROKU_CTX)
    expect(spawn).toHaveBeenNthCalledWith(2, 'heroku login', {
      reject: true,
      stdio: 'inherit',
    })
  })

  it('throws when both login attempts fail', async () => {
    jest
      .mocked(spawn)
      // whoami error
      .mockResolvedValueOnce(MOCK_ERR_NOT_AUTHED)
      // login error
      .mockResolvedValue({
        stderr: 'not logged in',
        exitCode: 100,
      })
    await expect(
      async () => await authHerokuTask(MOCK_HEROKU_CTX)
    ).rejects.toThrow(HEROKU_ERRORS.NOT_LOGGED_IN)
  })
})

describe('happy heroku authentication paths', () => {
  it('uses current user when confirmed', async () => {
    jest
      .mocked(spawn)
      .mockResolvedValueOnce({ stdout: 'snap@crackle.com', exitCode: 0 })
      // another whoami check after login
      .mockResolvedValueOnce({
        stdout: 'success login',
        exitCode: 0,
      })
    jest.mocked(prompts).mockResolvedValueOnce({
      useUser: true,
    })

    expect(async () => await authHerokuTask(MOCK_HEROKU_CTX)).not.toThrow()
  })

  it('already logged in wants to reauth', async () => {
    jest
      .mocked(spawn)
      .mockResolvedValueOnce({
        stdout: 'snap@crackle.com',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'success logout',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'success login',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'iamloggedin@email.com',
        exitCode: 0,
      })
    jest.mocked(prompts).mockResolvedValueOnce({
      useUser: false,
    })
    await authHerokuTask(MOCK_HEROKU_CTX)

    expect(spawn).toHaveBeenNthCalledWith(3, 'heroku login', {
      reject: true,
      stdio: 'inherit',
    })
  })
})
