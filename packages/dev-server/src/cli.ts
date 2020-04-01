import yargs from 'yargs'
import {
  getSideConfig,
  getSidePaths,
  NodeTargetPaths,
} from '@redwoodjs/internal'

// import { start } from './main'

// const command = yargs
//   .command(({ side }) => {
//     // fetch the configuration and paths for the side.

//   })
//   .option('side', { type: 'string', default: 'api' })

// process.env !== 'test' ? command.argv : command.p

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
