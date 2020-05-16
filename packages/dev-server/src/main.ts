#!/usr/bin/env node
import yargs from 'yargs'
import { getConfig, getPaths } from '@redwoodjs/internal'
import type { NodeTargetPaths } from '@redwoodjs/internal'

import { server, setLambdaFunctions } from './http'
import { watchFunctions } from './watchApiSide'
import { requestHandler } from './requestHandlers/awsLambda'

// TODO: Expand the sides once that concept is introduced.
export const getArgsForSide = (
  side: 'api'
): {
  port: number
  host: string
  paths: NodeTargetPaths
} => {
  const config = getConfig()
  const { port, host } = config[side]

  const paths = getPaths()

  return {
    httpMethod: request.method,
    headers: request.headers,
    path: request.path,
    queryStringParameters: qs.parse(request.url.split(/\?(.+)/)[1]),
    requestContext: {
      identity: {
        sourceIp: request.ip,
      },
    },
    ...parseBody(request.body), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent
}

const expressResponseForLambdaResult = (
  expressResFn: Response,
  lambdaResult: APIGatewayProxyResult
) => {
  // The response object must be compatible with JSON.stringify according
  // to the aws lambda docs, but the type definition specifies that it has
  // to be a string. Let's double check this.
  const { statusCode = 200, headers, body = '' } = lambdaResult
  if (headers) {
    Object.keys(headers).forEach((headerName) => {
      const headerValue: any = headers[headerName]
      expressResFn.setHeader(headerName, headerValue)
    })
  }
}

const { side } = yargs.option('side', { default: 'api' }).argv

try {
  const { host, port, paths } = getArgsForSide(side as 'api')
  server({ requestHandler }).listen(port, () => {
    console.log(`Running at 'http://${host}:${port}'`)
    console.log(`Watching files in '${paths.functions}'`)
    let startBuild = new Date().getTime()
    watchFunctions({
      paths,
      onChange: () => {
        startBuild = new Date().getTime()
        process.stdout.write('Change detected, building... ')
      },
      onImport: (functions) => {
        console.log(`Done. Took ${new Date().getTime() - startBuild}ms.`)
        setLambdaFunctions(functions)
      },
    })
  })
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
