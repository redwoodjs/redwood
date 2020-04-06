import yargs from 'yargs'
import {
  getSideConfig,
  getSidePaths,
  NodeTargetPaths,
} from '@redwoodjs/internal'

import { server } from './http'
import { watchFunctions } from './watchFunctions'

export const getArgsForSide = (
  side: string
): { port: number; host: string; paths: NodeTargetPaths } => {
  const { port, host } = getSideConfig(side)
  const paths = getSidePaths(side) as NodeTargetPaths

  return {
    port,
    host,
    paths,
  }
}

const { side } = yargs.option('side', { default: 'api' }).argv

try {
  const { host, port, paths } = getArgsForSide(side)

  console.log()
  server().listen(8910, () => {
    console.log(`Running at 'http://${host}:${port}'`)
    console.log(`Watching files in '${paths.functions}'`)

    watchFunctions({
      paths,
      onImport: (functions) => {
        console.log(Object.keys(functions))
      },
    })
  })
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
