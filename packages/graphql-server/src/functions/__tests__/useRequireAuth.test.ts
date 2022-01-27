import type { APIGatewayEvent, Context } from 'aws-lambda'

import { parseJWT } from '@redwoodjs/api'

import { AuthenticationError } from '../../errors'

type RedwoodUser = Record<string, unknown> & { roles?: string[] }

export const mockedAuthenticationEvent = ({
  headers = {},
}): APIGatewayEvent => {
  return {
    body: 'MOCKED_BODY',
    headers,
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/MOCK_PATH',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'MOCKED_ACCOUNT',
      apiId: 'MOCKED_API_ID',
      authorizer: { name: 'MOCKED_AUTHORIZER' },
      protocol: 'HTTP',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '123.123.123.123',
        user: null,
        userAgent: null,
        userArn: null,
      },
      httpMethod: 'POST',
      path: '/MOCK_PATH',
      stage: 'MOCK_STAGE',
      requestId: 'MOCKED_REQUEST_ID',
      requestTimeEpoch: 1,
      resourceId: 'MOCKED_RESOURCE_ID',
      resourcePath: 'MOCKED_RESOURCE_PATH',
    },
    resource: 'MOCKED_RESOURCE',
  }
}

const handler = async (
  _event: APIGatewayEvent,
  _context: Context
): Promise<any> => {
  // @MARK
  // Don't use globalContext until beforeAll runs
  const globalContext = require('../../globalContext').context
  const currentUser = globalContext.currentUser

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(currentUser),
  }
}

const handlerWithError = async (
  _event: APIGatewayEvent,
  _context: Context
): Promise<any> => {
  // @MARK
  // Don't use globalContext until beforeAll runs
  const globalContext = require('../../globalContext').context
  const currentUser = globalContext.currentUser

  try {
    throw new AuthenticationError('An error occurred in the handler')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentUser),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    }
  }
}

const getCurrentUser = async (decoded, { token }): Promise<RedwoodUser> => {
  if (!decoded && token) {
    return { token }
  }

  const { roles } = parseJWT({ decoded })

  if (roles) {
    return { ...decoded, roles }
  }

  return { ...decoded }
}

const getCurrentUserWithError = async (
  _decoded,
  { _token }
): Promise<RedwoodUser> => {
  throw Error('Something went wrong getting the user info')
}

describe('useRequireAuth', () => {
  beforeAll(() => {
    process.env.DISABLE_CONTEXT_ISOLATION = '1'
  })

  afterAll(() => {
    process.env.DISABLE_CONTEXT_ISOLATION = '0'
  })

  it('Updates context with output of current user', async () => {
    // @MARK
    // Because we use context inside useRequireAuth, we only want to import this function
    // once we disable context isolation for our test
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    const headers = {
      'auth-provider': 'custom',
      authorization: 'Bearer myToken',
    }

    const output = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers }),
      {}
    )

    const response = JSON.parse(output.body)
    expect(response.token).toEqual('myToken')
  })

  it('Updates context with output of current user with roles', async () => {
    // @MARK
    // Because we use context inside useRequireAuth, we only want to import this function
    // once we disable context isolation for our test
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    // The authorization JWT is valid and has roles in app metadata
    // {
    //   "sub": "1234567891",
    //   "name": "John Editor",
    //   "iat": 1516239022,
    //   "app_metadata": {
    //      "roles": ["editor"]
    //   }
    // }
    const headersWithRoles = {
      'auth-provider': 'netlify',
      authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkxIiwibmFtZSI6IkpvaG4gRWRpdG9yIiwiaWF0IjoxNTE2MjM5MDIyLCJhcHBfbWV0YWRhdGEiOnsicm9sZXMiOlsiZWRpdG9yIl19fQ.Fhxe58-7BcjJDoYQAZluJYGwPTPLU0x6K5yA3zXKaX8',
    }

    const output = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: headersWithRoles }),
      {}
    ) // ?

    const response = JSON.parse(output.body)
    expect(response.name).toEqual('John Editor')
    expect(response.roles).toContain('editor')
  })
  it('is 401 Unauthenticated status if an error occurs when getting current user info', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser: getCurrentUserWithError,
    })

    const customHeaders = {
      'auth-provider': 'custom',
      authorization: 'Bearer myToken',
    }

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: customHeaders }),
      {}
    )

    expect(response.statusCode).toEqual(401)
  })

  it('is 401 Unauthenticated status if no auth headers present', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    const missingHeaders = null

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: missingHeaders }),
      {}
    )

    expect(response.statusCode).toEqual(401)
  })

  it('is 200 status with token if the auth provider is unsupported', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    const unsupportedProviderHeaders = {
      'auth-provider': 'this-auth-provider-is-unsupported',
      authorization: 'Basic myToken',
    }

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: unsupportedProviderHeaders }),
      {}
    )

    const body = JSON.parse(response.body)

    expect(response.statusCode).toEqual(200)
    expect(body.token).toEqual('myToken')
  })

  it('returns 200 if decoding JWT succeeds for netlify', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    // Note: The Bearer token JWT contains:
    // {
    //   "sub": "1234567890",
    //   "name": "John Doe",
    //   "iat": 1516239022
    // }

    const netlifyJWTHeaders = {
      'auth-provider': 'netlify',
      authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    }

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: netlifyJWTHeaders }),
      {}
    )

    const body = JSON.parse(response.body)

    expect(response.statusCode).toEqual(200)
    expect(body['sub']).toEqual('1234567890')
    expect(body.name).toEqual('John Doe')
  })

  it('is 401 Unauthenticated status if decoding JWT fails for netlify', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    const invalidJWTHeaders = {
      'auth-provider': 'netlify',
      authorization: 'Bearer this-is-an-invalid-jwt',
    }

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: invalidJWTHeaders }),
      {}
    )

    expect(response.statusCode).toEqual(401)
  })

  it('is 401 Unauthenticated status if decoding JWT fails for supabase', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handler,
      getCurrentUser,
    })

    const invalidJWTHeaders = {
      'auth-provider': 'supabase',
      authorization: 'Bearer this-is-an-invalid-jwt',
    }

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: invalidJWTHeaders }),
      {}
    )

    expect(response.statusCode).toEqual(401)
  })

  it('is 500 Server Error status if handler errors', async () => {
    const { useRequireAuth } = require('../useRequireAuth')

    const customHeaders = {
      'auth-provider': 'custom',
      authorization: 'Bearer myToken',
    }

    const handlerEnrichedWithAuthentication = useRequireAuth({
      handlerFn: handlerWithError,
      getCurrentUser,
    })

    const response = await handlerEnrichedWithAuthentication(
      mockedAuthenticationEvent({ headers: customHeaders }),
      {}
    )

    const message = JSON.parse(response.body).error

    expect(response.statusCode).toEqual(500)
    expect(message).toEqual('An error occurred in the handler')
  })
})
