import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { getAuthenticationContext } from '../index'

export const createMockedEvent = ({
  authProvider,
}: {
  authProvider: string
}): APIGatewayProxyEvent => {
  return {
    body: null,
    headers: {
      'auth-provider': authProvider,
      authorization: 'Bearer auth-test-token',
    },
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

describe('getAuthenticationContext', () => {
  it('Can take a single auth decoder for the given provider', async () => {
    const authDecoderOne = async (_token: string, type: string) => {
      if (type !== 'one') {
        return null
      }

      return {
        iss: 'one',
        sub: 'user-id',
      }
    }

    const result = await getAuthenticationContext({
      authDecoder: authDecoderOne,
      event: createMockedEvent({ authProvider: 'one' }),
      context: {} as Context,
    })

    if (!result) {
      fail('Result is undefined')
    }

    const [decoded, { type, schema, token }] = result

    expect(decoded).toMatchObject({
      iss: 'one',
      sub: 'user-id',
    })
    expect(type).toEqual('one')
    expect(schema).toEqual('Bearer')
    expect(token).toEqual('auth-test-token')
  })

  it('Can take a single auth decoder for some other provider', async () => {
    const authDecoderOne = async (_token: string, type: string) => {
      if (type !== 'one') {
        return null
      }

      return {
        iss: 'one',
        sub: 'user-id',
      }
    }

    const result = await getAuthenticationContext({
      authDecoder: authDecoderOne,
      event: createMockedEvent({ authProvider: 'some-other' }),
      context: {} as Context,
    })

    if (!result) {
      fail('Result is undefined')
    }

    const [decoded, { type, schema, token }] = result

    expect(decoded).toBeNull()
    expect(type).toEqual('some-other')
    expect(schema).toEqual('Bearer')
    expect(token).toEqual('auth-test-token')
  })

  it('Can take an empty array of auth decoders', async () => {
    const result = await getAuthenticationContext({
      authDecoder: [],
      event: createMockedEvent({ authProvider: 'two' }),
      context: {} as Context,
    })

    if (!result) {
      fail('Result is undefined')
    }

    const [decoded, { type, schema, token }] = result

    expect(decoded).toBeNull()
    expect(type).toEqual('two')
    expect(schema).toEqual('Bearer')
    expect(token).toEqual('auth-test-token')
  })

  it('Can take an array of auth decoders', async () => {
    const authDecoderOne = async (_token: string, type: string) => {
      if (type !== 'one') {
        return null
      }

      return {
        iss: 'one',
        sub: 'user-id',
      }
    }

    const authDecoderTwo = async (_token: string, type: string) => {
      if (type !== 'two') {
        return null
      }

      return {
        iss: 'two',
        sub: 'user-id',
      }
    }

    const result = await getAuthenticationContext({
      authDecoder: [authDecoderOne, authDecoderTwo],
      event: createMockedEvent({ authProvider: 'two' }),
      context: {} as Context,
    })

    if (!result) {
      fail('Result is undefined')
    }

    const [decoded, { type, schema, token }] = result

    expect(decoded).toMatchObject({
      iss: 'two',
      sub: 'user-id',
    })
    expect(type).toEqual('two')
    expect(schema).toEqual('Bearer')
    expect(token).toEqual('auth-test-token')
  })

  it('Works even without any auth decoders', async () => {
    const result = await getAuthenticationContext({
      event: createMockedEvent({ authProvider: 'two' }),
      context: {} as Context,
    })

    if (!result) {
      fail('Result is undefined')
    }

    const [decoded, { type, schema, token }] = result

    expect(decoded).toEqual(null)
    expect(type).toEqual('two')
    expect(schema).toEqual('Bearer')
    expect(token).toEqual('auth-test-token')
  })
})
