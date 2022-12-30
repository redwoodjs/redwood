import { MOCK_HEROKU_CTX } from '../__mocks__/ctx'
import { HerokuApi } from '../api'

jest.mock('../stdio')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('heroku api interface', () => {
  it('calls apps command with json flag', async () => {
    await HerokuApi.apps(MOCK_HEROKU_CTX)
    const called = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(called[0][0]).toEqual('heroku apps --json')
  })
  it('returns already taken when thats the case', async () => {
    jest
      .mocked(MOCK_HEROKU_CTX.spawn)
      .mockRejectedValueOnce({ stderr: 'already taken' })

    const actual = await HerokuApi.create(MOCK_HEROKU_CTX)

    expect(actual).toEqual('already taken')
  })
  it('creates and extracts appUrl', async () => {
    jest
      .mocked(MOCK_HEROKU_CTX.spawn)
      .mockResolvedValueOnce('i_am_url | i_am_repo')

    const actual = await HerokuApi.create(MOCK_HEROKU_CTX)

    expect(actual).toBe('i_am_url')
  })

  it('Re-throws when unexpected occurs', async () => {
    jest.mocked(MOCK_HEROKU_CTX.spawn).mockRejectedValue(new Error('boom'))

    await expect(HerokuApi.create(MOCK_HEROKU_CTX)).rejects.toThrow('boom')
  })

  it('destroys the app with appname', async () => {
    jest.mocked(MOCK_HEROKU_CTX.spawn).mockResolvedValueOnce('output')

    await HerokuApi.destroy(MOCK_HEROKU_CTX)

    const called = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(called[0][0]).toEqual(
      'heroku apps:destroy captain-crunch --confirm captain-crunch'
    )
  })

  it('logs a user in', async () => {
    await HerokuApi.login(MOCK_HEROKU_CTX)

    const calls = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(calls[0][0]).toEqual('heroku auth:login')
  })

  it('logs a user out', async () => {
    await HerokuApi.logout(MOCK_HEROKU_CTX)

    const calls = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(calls[0][0]).toEqual('heroku auth:logout')
  })

  it('adds a remote', async () => {
    await HerokuApi.addRemote(MOCK_HEROKU_CTX)

    const calls = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(calls[0][0]).toEqual('heroku git:remote -a captain-crunch')
  })

  it('pushes to heroku', async () => {
    await HerokuApi.push(MOCK_HEROKU_CTX)

    const calls = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(calls[0][0]).toEqual('git push heroku main')
  })

  it('pushes to heroku', async () => {
    await HerokuApi.followLogs(MOCK_HEROKU_CTX)

    const calls = jest.mocked(MOCK_HEROKU_CTX.spawn).mock.calls
    expect(calls[0][0]).toEqual('heroku logs --tail --app captain-crunch')
  })
})
