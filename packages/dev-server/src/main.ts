#!/usr/bin/env node
import yargs from 'yargs'

import type { NodeTargetPaths } from '@redwoodjs/internal'
import { getConfig, getPaths } from '@redwoodjs/internal'

import { handleError } from './error'
import { server, setLambdaFunctions } from './http'
import { requestHandlerApolloServer } from './requestHandlers/awsLambdaApolloServer'
import { requestHandlerEnvelop } from './requestHandlers/awsLambdaEnvelop'
import { watchFunctions } from './watchApiSide'

// TODO: Expand the sides once that concept is introduced.
export const getArgsForSide = (
  side: 'api'
): {
  port: number
  host: string
  paths: NodeTargetPaths
  useEnvelop: boolean
} => {
  const config = getConfig()
  const { port, host } = config[side]
  const useEnvelop = config.experimental.useEnvelop

  const paths = getPaths()

  return {
    port,
    host,
    paths: paths[side],
    useEnvelop,
  }
}

const { side } = yargs.option('side', { default: 'api' }).argv

try {
  const { host, port, paths, useEnvelop } = getArgsForSide(side as 'api')

  const requestHandler = useEnvelop
    ? requestHandlerEnvelop
    : requestHandlerApolloServer

  server({ requestHandler }).listen(port, () => {
    console.log(`Running at 'http://${host}:${port}'`)

    if (useEnvelop) {
      console.log('Using experimental envelop GraphQL execution layer ')
    }

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
      onException: async (e) => {
        console.log(await handleError(e))
      },
    })
  })
} catch (e) {
  handleError(e).then((m) => {
    console.log(m)
    process.exit(1)
  })
}
