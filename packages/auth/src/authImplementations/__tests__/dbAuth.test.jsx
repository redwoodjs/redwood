import { dbAuth } from '../dbAuth'

global.RWJS_API_DBAUTH_URL = '/.redwood/functions'

jest.mock('cross-undici-fetch', () => {
  return
})

beforeAll(() => {
  global.fetch = jest.fn().mockImplementation(async () => {
    return { text: () => '', json: () => ({}) }
  })
})

beforeEach(() => {
  global.fetch.mockClear()
})

describe('dbAuth', () => {
  it('sets a default credentials value if not included', async () => {
    const client = dbAuth(() => null)
    await client.getToken()

    expect(global.fetch).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'same-origin',
      }
    )
  })

  it('passes through fetchOptions to forgotPasswrd calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.forgotPassword('username')

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to getToken calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.getToken()

    expect(global.fetch).toBeCalledWith(
      `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
      {
        credentials: 'include',
      }
    )
  })

  it('passes through fetchOptions to login calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.login({ username: 'username', password: 'password' })

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to logout calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.logout()

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to resetPassword calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.resetPassword({})

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to signup calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.signup({})

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })

  it('passes through fetchOptions to validateResetToken calls', async () => {
    const client = dbAuth(() => null, {
      fetchConfig: { credentials: 'include' },
    })
    await client.validateResetToken('token')

    expect(global.fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })
})
