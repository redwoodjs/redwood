import jwt from 'jsonwebtoken'
import { SigningKeyNotFoundError } from 'jwks-rsa'
import nock from 'nock'

import {
  auth0Config,
  verifyAuth0Token,
  getAuth0SigningKey,
  getAuth0PublicKey,
} from '../auth0'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}))

describe('Auth0 Decoder', () => {
  test('verify, and not decode, should be called in production', () => {
    const { NODE_ENV } = process.env

    process.env.NODE_ENV = 'production'
    process.env.AUTH0_DOMAIN = 'redwoodjs.com'
    process.env.AUTH0_AUDIENCE = 'web-app'

    // @ts-expect-error Ignore this error.
    verifyAuth0Token({})

    expect(jwt.decode).not.toBeCalled()
    expect(jwt.verify).toBeCalled()

    process.env.NODE_ENV = NODE_ENV
  })

  test('error when AUTH0_DOMAIN missing', () => {
    const { NODE_ENV } = process.env

    process.env.NODE_ENV = 'production'

    delete process.env.AUTH0_DOMAIN

    process.env.AUTH0_AUDIENCE = 'web-app'

    expect(() => auth0Config()).toThrowError(
      '`AUTH0_DOMAIN` or `AUTH0_AUDIENCE` env vars are not set.'
    )

    process.env.NODE_ENV = NODE_ENV
  })

  test('error when AUTH0_AUDIENCE missing', () => {
    const { NODE_ENV } = process.env

    process.env.NODE_ENV = 'production'
    process.env.AUTH0_DOMAIN = 'redwoodjs.com'

    delete process.env.AUTH0_AUDIENCE

    expect(() => auth0Config()).toThrowError(
      '`AUTH0_DOMAIN` or `AUTH0_AUDIENCE` env vars are not set.'
    )

    process.env.NODE_ENV = NODE_ENV
  })

  describe('JwksClient handles signing keys to decode token', () => {
    beforeEach(() => {
      nock.cleanAll()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    const keys = [
      {
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
        x5c: [
          'MIIDDTCCAfWgAwIBAgIJAJVkuSv2H8mDMA0GCSqGSIb3DQEBBQUAMB0xGzAZBgNVBAMMEnNhbmRyaW5vLmF1dGgwLmNvbTAeFw0xNDA1MTQyMTIyMjZaFw0yODAxMjEyMTIyMjZaMB0xGzAZBgNVBAMMEnNhbmRyaW5vLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL6jWASkHhXz5Ug6t5BsYBrXDIgrWu05f3oq2fE+5J5REKJiY0Ddc+Kda34ZwOptnUoef3JwKPDAckTJQDugweNNZPwOmFMRKj4xqEpxEkIX8C+zHs41Q6x54ZZy0xU+WvTGcdjzyZTZ/h0iOYisswFQT/s6750tZG0BOBtZ5qS/80tmWH7xFitgewdWteJaASE/eO1qMtdNsp9fxOtN5U/pZDUyFm3YRfOcODzVqp3wOz+dcKb7cdZN11EYGZOkjEekpcedzHCo9H4aOmdKCpytqL/9FXoihcBMg39s1OW3cfwfgf5/kvOJdcqR4PoATQTfsDVoeMWVB4XLGR6SC5kCAwEAAaNQME4wHQYDVR0OBBYEFHDYn9BQdup1CoeoFi0Rmf5xn/W9MB8GA1UdIwQYMBaAFHDYn9BQdup1CoeoFi0Rmf5xn/W9MAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEFBQADggEBAGLpQZdd2ICVnGjc6CYfT3VNoujKYWk7E0shGaCXFXptrZ8yaryfo6WAizTfgOpQNJH+Jz+QsCjvkRt6PBSYX/hb5OUDU2zNJN48/VOw57nzWdjI70H2Ar4oJLck36xkIRs/+QX+mSNCjZboRwh0LxanXeALHSbCgJkbzWbjVnfJEQUP9P/7NGf0MkO5I95C/Pz9g91y8gU+R3imGppLy9Zx+OwADFwKAEJak4JrNgcjHBQenakAXnXP6HG4hHH4MzO8LnLiKv8ZkKVL67da/80PcpO0miMNPaqBBMd2Cy6GzQYE0ag6k0nk+DMIFn7K+o21gjUuOEJqIbAvhbf2KcM=',
        ],
        n: 'vqNYBKQeFfPlSDq3kGxgGtcMiCta7Tl_eirZ8T7knlEQomJjQN1z4p1rfhnA6m2dSh5_cnAo8MByRMlAO6DB401k_A6YUxEqPjGoSnESQhfwL7MezjVDrHnhlnLTFT5a9MZx2PPJlNn-HSI5iKyzAVBP-zrvnS1kbQE4G1nmpL_zS2ZYfvEWK2B7B1a14loBIT947Woy102yn1_E603lT-lkNTIWbdhF85w4PNWqnfA7P51wpvtx1k3XURgZk6SMR6Slx53McKj0fho6Z0oKnK2ov_0VeiKFwEyDf2zU5bdx_B-B_n-S84l1ypHg-gBNBN-wNWh4xZUHhcsZHpILmQ',
        e: 'AQAB',
        kid: 'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg',
        x5t: 'RkI5MjI5OUY5ODc1N0Q4QzM0OUYzNkVGMTJDOUEzQkFCOTU3NjE2Rg',
      },
      {
        alg: 'RS256',
        kty: 'RSA',
        use: 'sig',
        x5c: [
          'MIIDGzCCAgOgAwIBAgIJAPQM5+PwmOcPMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNVBAMMGXNhbmRyaW5vLWRldi5ldS5hdXRoMC5jb20wHhcNMTUwMzMxMDkwNTQ3WhcNMjgxMjA3MDkwNTQ3WjAkMSIwIAYDVQQDDBlzYW5kcmluby1kZXYuZXUuYXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv/SECtT7H4rxKtX2HpGhSyeYTe3Vet8YQpjBAr+1TnQ1fcYfvfmnVRHvhmTwABktD1erF1lxFsrRw92yBDOHlL7lj1n2fcfLftSoStgvRHVg52kR+CkBVQ6/mF1lYkefIjik6YRMf55Eu4FqDyVG2dgd5EA8kNO4J8OPc7vAtZyXrRYOZjVXbEgyjje/V+OpMQxAHP2Er11TLuzJjioP0ICVqhAZdq2sLk7agoxn64md6fqOk4N+7lJkU4+412VD0qYwKxD7nGsEclYawKoZD9/xhCk2qfQ/HptIumrdQ5ox3Sq5t2a7VKa41dBUQ1MQtXG2iY7S9RlfcMIyQwGhOQIDAQABo1AwTjAdBgNVHQ4EFgQUHpS1fvO/54G2c1VpEDNUZRSl44gwHwYDVR0jBBgwFoAUHpS1fvO/54G2c1VpEDNUZRSl44gwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAtm9I0nr6eXF5aq4yllfiqZcQ6mKrJLH9Rm4Jv+olniNynTcnpwprRVLToIawc8MmzIGZTtCn7u+dSxWf1UNE+SH7XgEnGtO74239vleEx1+Tf5viIdsnCxgvFiPdOqRlc9KcFSWd6a7RzcglnyU7GEx0K5GLv1wPA6qEM+3uwNwjAyVSu5dFw8kCfaSvlk5rXKRUzSoW9NVomw6+tADR8vMZS+4KThZ+4GH0rMN4KjIaRFxW8OMVYOn12uq33fLCd6MuPHW/rklxLbQBoHIU/ClNhbD0t6f00w9lHhPy4IP73rv7Oow0Ny6i70Iq0ijqj+kAtnrphlOvLFxqn6nCvQ==',
        ],
        n: 'v_SECtT7H4rxKtX2HpGhSyeYTe3Vet8YQpjBAr-1TnQ1fcYfvfmnVRHvhmTwABktD1erF1lxFsrRw92yBDOHlL7lj1n2fcfLftSoStgvRHVg52kR-CkBVQ6_mF1lYkefIjik6YRMf55Eu4FqDyVG2dgd5EA8kNO4J8OPc7vAtZyXrRYOZjVXbEgyjje_V-OpMQxAHP2Er11TLuzJjioP0ICVqhAZdq2sLk7agoxn64md6fqOk4N-7lJkU4-412VD0qYwKxD7nGsEclYawKoZD9_xhCk2qfQ_HptIumrdQ5ox3Sq5t2a7VKa41dBUQ1MQtXG2iY7S9RlfcMIyQwGhOQ',
        e: 'AQAB',
        kid: 'NkFCNEE1NDFDNTQ5RTQ5OTE1QzRBMjYyMzY0NEJCQTJBMjJBQkZCMA',
        x5t: 'NkFCNEE1NDFDNTQ5RTQ5OTE1QzRBMjYyMzY0NEJCQTJBMjJBQkZCMA',
      },
    ]

    const jwksResponse = {
      keys: keys,
    }

    const kid = keys[1].kid

    test('when signingKey is found', async () => {
      const { NODE_ENV } = process.env

      process.env.NODE_ENV = 'production'
      process.env.AUTH0_DOMAIN = 'test-signing-key-found.example.com'
      process.env.AUTH0_AUDIENCE = 'web-app-test-signing-key-found'

      nock(auth0Config().issuer)
        .persist()
        .get('/.well-known/jwks.json')
        .reply(200, jwksResponse)

      const signingKey = await getAuth0SigningKey({
        kid,
      })

      expect(signingKey.kid).toEqual(kid)

      process.env.NODE_ENV = NODE_ENV
    })

    test('when signingKey is not found', async () => {
      const { NODE_ENV } = process.env

      process.env.NODE_ENV = 'production'
      process.env.AUTH0_DOMAIN = 'test-signing-key-not-found.redwoodjs.com'
      process.env.AUTH0_AUDIENCE = 'web-app-test-signing-key-not-found'

      nock(auth0Config().issuer)
        .persist()
        .get('/.well-known/jwks.json')
        .reply(200, jwksResponse)

      await expect(
        getAuth0SigningKey({
          kid: 'key-does-not-exist-in-jwks',
        })
      ).rejects.toThrow(SigningKeyNotFoundError)

      process.env.NODE_ENV = NODE_ENV
    })

    test('getPublicKey when signing key is found', async () => {
      const { NODE_ENV } = process.env

      process.env.NODE_ENV = 'production'
      process.env.AUTH0_DOMAIN =
        'test-public-key-signing-key-found.redwoodjs.com'
      process.env.AUTH0_AUDIENCE = 'web-app-test-public-key-signing-key-found'

      nock(auth0Config().issuer)
        .persist()
        .get('/.well-known/jwks.json')
        .reply(200, jwksResponse)

      const publicKey = await getAuth0PublicKey({
        kid,
      })

      expect(publicKey).toBeTruthy()
      expect(publicKey).toMatch(
        /-----BEGIN PUBLIC KEY-----(.*)-----END PUBLIC KEY-----/s
      )

      process.env.NODE_ENV = NODE_ENV
    })

    test('getPublicKey when signing key is not found', async () => {
      const { NODE_ENV } = process.env

      process.env.NODE_ENV = 'production'
      process.env.AUTH0_DOMAIN =
        'test-public-key-signing-key-not-found.redwoodjs.com'
      process.env.AUTH0_AUDIENCE =
        'web-app-test-public-key-signing-key-not-found'

      nock(auth0Config().issuer)
        .persist()
        .get('/.well-known/jwks.json')
        .reply(200, jwksResponse)

      await expect(
        getAuth0PublicKey({
          kid: 'key-does-not-exist-in-jwks-public',
        })
      ).rejects.toThrow(SigningKeyNotFoundError)

      process.env.NODE_ENV = NODE_ENV
    })
  })
})
