import fetch from 'node-fetch'

import { dbAuth } from '../dbAuth'

global.RWJS_API_DBAUTH_URL = '/.redwood/functions'

jest.mock('node-fetch', () => {
  return jest.fn().mockImplementation(() => {
    return { text: () => '', json: () => ({}) }
  })
})

describe('dbAuth', () => {
  it('sets a default credentials value if not included', async () => {
    const client = dbAuth(() => null)
    await client.getToken()

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
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

    expect(fetch).toBeCalledWith(
      global.RWJS_API_DBAUTH_URL,
      expect.objectContaining({
        credentials: 'include',
      })
    )
  })
})
