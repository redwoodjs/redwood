import yargs from 'yargs'
import {
  getSideConfig,
  getSidePaths,
  NodeTargetPaths,
} from '@redwoodjs/internal'

export const getArgsForSide = (
  side: string
): { port: number; host: string; functionsPath: string; watchPath: string } => {
  const { port, host } = getSideConfig(side)
  const paths = getSidePaths(side) as NodeTargetPaths

  return {
    port,
    host,
    functionsPath: paths.functions,
    watchPath: paths.base,
  }
}

const { side } = yargs.option('side', { default: 'api' }).argv

try {
  const { host, port, functionsPath, watchPath } = getArgsForSide(side)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
