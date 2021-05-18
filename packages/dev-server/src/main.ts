#!/usr/bin/env node
import yargs from 'yargs'

import type { NodeTargetPaths } from '@redwoodjs/internal'
import { getConfig, getPaths } from '@redwoodjs/internal'

import { handleError } from './error'
import { server, setLambdaFunctions } from './http'
import { requestHandler } from './requestHandlers/awsLambda'
import { watchFunctions } from './watchApiSide'

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
    port,
    host,
    paths: paths[side],
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
