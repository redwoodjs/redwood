#!/usr/bin/env node
import yargs from 'yargs'
import { getConfig, getPaths } from '@redwoodjs/internal'
import type { NodeTargetPaths } from '@redwoodjs/internal'

import { server, setLambdaFunctions } from './http'
import { watchFunctions } from './watchApiSide'
import { requestHandler } from './requestHandlers/awsLambda'
import { handleError } from './error'

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
