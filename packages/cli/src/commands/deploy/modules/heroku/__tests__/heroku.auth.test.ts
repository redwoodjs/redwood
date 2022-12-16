import { MOCK_HEROKU_CTX } from '../__mocks__/mock_ctx'
import { Heroku } from '../api'
import { authStep } from '../auth'
import { Questions } from '../questions'

jest.mock('prompts')
jest.mock('../stdio')
jest.mock('fs')
jest.mock('../../../../../lib')

jest.mock('../api')
jest.mock('../questions')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Unhappy heroku authentication paths', () => {
  it('trys to login when user isnt already', async () => {
    jest.mocked(Heroku.whoami).mockResolvedValueOnce('')
    jest.mocked(Heroku.login).mockResolvedValueOnce('email@emaily.com')

    const actual = await authStep(MOCK_HEROKU_CTX)

    expect(actual).toEqual({
      ...MOCK_HEROKU_CTX,
      email: 'email@emaily.com',
    })
  })

  it('throws when both login attempts fail', async () => {
    jest.mocked(Heroku.whoami).mockResolvedValueOnce('')
    jest.mocked(Heroku.login).mockResolvedValueOnce('')

    await expect(authStep(MOCK_HEROKU_CTX)).rejects.toThrow()
  })
})

describe('happy heroku authentication paths', () => {
  it('uses current user when asked', async () => {
    jest.mocked(Heroku.whoami).mockResolvedValueOnce('already@logged.com')

    jest.mocked(Questions.shouldReAuthenticate).mockResolvedValueOnce(false)

    const actual = await authStep(MOCK_HEROKU_CTX)

    expect(actual).toEqual({ ...MOCK_HEROKU_CTX, email: 'already@logged.com' })
  })

  it('already logged in wants to reauth', async () => {
    jest.mocked(Heroku.whoami).mockResolvedValueOnce('already@logged.com')

    jest.mocked(Questions.shouldReAuthenticate).mockResolvedValueOnce(true)

    jest.mocked(Heroku.reauth).mockResolvedValueOnce('new@auth.com')
    const actual = await authStep(MOCK_HEROKU_CTX)

    expect(actual).toEqual({ ...MOCK_HEROKU_CTX, email: 'new@auth.com' })
  })
})
