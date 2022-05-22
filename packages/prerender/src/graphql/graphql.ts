import path from 'path'
import glob from 'glob'

import {
  createGraphQLHandler,
  SdlGlobImports,
  ServicesGlobImports,
} from '@redwoodjs/graphql-server'

import { getPaths } from '@redwoodjs/internal'

async function getDirectives() {
  const paths = getPaths()
  const directivePaths = glob
    .sync(paths.api.directives + '/**/*.{js,ts}')
    .filter((directivePath) =>
      // Keep only files that have just one dot (.) in the filename
      /^[^.]+\.(js|ts)$/.test(directivePath.split(path.sep).slice(-1)[0])
    )

  const directives = await directivePaths.reduce<
    Promise<Record<string, unknown>>
  >(async (prev, cur) => {
    // `name` is just the filename without path, and without extension
    const { name } = path.parse(cur)

    return {
      ...(await prev),
      [name + '_' + name]: await import(cur),
    }
  }, Promise.resolve({}))

  return directives
}

async function getSdls() {
  const paths = getPaths()
  const sdlPaths = glob.sync(paths.api.graphql + '/**/*.sdl.{js,ts}')

  const sdls = await sdlPaths.reduce<Promise<SdlGlobImports>>(
    async (prev, cur) => {
      // `name` is just the filename without path, and without extension
      const { name } = path.parse(cur)

      return {
        ...(await prev),
        [name.replace('.', '_')]: await import(cur),
      }
    },
    Promise.resolve({})
  )

  return sdls
}

async function getServices() {
  const paths = getPaths()
  const servicesPaths = glob
    .sync(paths.api.services + '/**/*.{js,ts}')
    .filter((servicePath) =>
      // Keep only files that have just one dot (.) in the filename
      /^[^.]+\.(js|ts)$/.test(servicePath.split(path.sep).slice(-1)[0])
    )

  const services = await servicesPaths.reduce<Promise<ServicesGlobImports>>(
    async (prev, cur) => {
      // `name` is just the filename without path, and without extension
      const { name } = path.parse(cur)

      return {
        ...(await prev),
        [name + '_' + name]: await import(cur),
      }
    },
    Promise.resolve({})
  )

  return services
}

export async function graphqlHandler() {
  const directives = await getDirectives()
  const sdls = await getSdls()
  const services = await getServices()

  const logger = {
    level: 'debug',
    fatal: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    warn: () => {},
    silent: () => {},
    child: () => {
      return logger
    },
  }

  const handler = createGraphQLHandler({
    getCurrentUser: () => {
      return Promise.resolve({})
    },
    loggerConfig: { logger: logger as any, options: {} },
    directives,
    sdls,
    services,
    onException: () => {
      console.log('got an exception')
    },
  })

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
