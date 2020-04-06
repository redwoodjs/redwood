import yargs from 'yargs'
import {
  getSideConfig,
  getSidePaths,
  NodeTargetPaths,
} from '@redwoodjs/internal'

import { server, setLambdaFunctions } from './http'
import { watchFunctions } from './watchFunctions'
import { requestHandler } from './awsLambdaRequestHandler'

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
  server({ requestHandler }).listen(port, () => {
    console.log(`Running at 'http://${host}:${port}'`)
    console.log(`Watching files in '${paths.functions}'`)
    watchFunctions({
      paths,

      onChange: (_event, _path) => {
        process.stdout.write('Reloading... ')
      },
      onImport: (functions) => {
        console.log('Ready')
        setLambdaFunctions(functions)
      },
    })
  })
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
