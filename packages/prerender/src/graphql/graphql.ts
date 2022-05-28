import fs from 'fs'
import path from 'path'
import { DocumentNode, print } from 'graphql'

import { getPaths } from '@redwoodjs/internal'
import { getOperationName } from '@redwoodjs/web'

export async function executeQuery(
  gqlHandler: (args: any) => Promise<any>,
  query: DocumentNode,
  variables?: Record<string, unknown>
) {
  const operationName = getOperationName(query)
  const operation = { operationName, query: print(query), variables }
  const handlerResult = await gqlHandler(operation)

  return handlerResult.body
}

export async function getGqlHandler() {
  const gqlPathTs = path.join(getPaths().api.functions, 'graphql.ts')
  const gqlPathJs = path.join(getPaths().api.functions, 'graphql.js')
  const gqlPath = fs.existsSync(gqlPathTs) ? gqlPathTs : gqlPathJs

  const { handler } = await import(gqlPath)

  return async (operation: Record<string, unknown>) => {
    return await handler(buildApiEvent(operation), buildContext())
  }
}

function buildApiEvent(body: Record<string, unknown>) {
  return {
    body: JSON.stringify(body),
    headers: {
      origin: 'http://localhost:8910',
      accept: '*/*',
      host: 'localhost:8910',
    },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/graphql',
    pathParameters: null,
    queryStringParameters: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
    requestContext: {
      requestId: 'req-3',
      identity: {
        sourceIp: '::1',
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
        user: null,
        userAgent: null,
        userArn: null,
      },
      authorizer: {},
      protocol: 'http',
      httpMethod: 'POST',
      path: '/graphql',
      stage: '',
      requestTimeEpoch: 0,
      resourceId: '',
      resourcePath: '',
      accountId: '',
      apiId: '',
    },
  }
}

function buildContext() {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 100,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  }
}
