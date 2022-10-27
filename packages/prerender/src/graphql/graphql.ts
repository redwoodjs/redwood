import path from 'path'

import { DocumentNode, print } from 'graphql'

import { getPaths } from '@redwoodjs/internal/dist/paths'
import { getOperationName } from '@redwoodjs/web'

import { GqlHandlerImportError } from '../errors'

/**
 * Loads the graphql server, with all the user's settings
 * And execute the query against it
 *
 * Note that this function does NOT throw errors, even when
 * there is a GraphQL error. Instead, it returns the result with the graphql error.
 *
 * @returns {Promise<QueryResult>}
 */
export async function executeQuery(
  gqlHandler: (args: any) => Promise<any>,
  query: DocumentNode,
  variables?: Record<string, unknown>
) {
  const operationName = getOperationName(query)
  const operation = { operationName, query: print(query), variables }
  const handlerResult = await gqlHandler(operation)

  return handlerResult?.body
}

/**
 * Finds the graphql handler, returns a function
 * that can be used to execute queries against it
 *
 * Throws GqlHandlerImportError, so that we can warn the user (but not blow up)
 */
export async function getGqlHandler() {
  const gqlPath = path.join(getPaths().api.functions, 'graphql')

  try {
    const { handler } = await import(gqlPath)

    return async (operation: Record<string, unknown>) => {
      return await handler(buildApiEvent(operation), buildContext())
    }
  } catch (e) {
    return () => {
      throw new GqlHandlerImportError(
        `Unable to import GraphQL handler at ${gqlPath}`
      )
    }
  }
}

function buildApiEvent(body: Record<string, unknown>) {
  return {
    body: JSON.stringify(body),
    headers: {
      origin: 'http://localhost:8910',
      'content-type': 'application/json',
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
