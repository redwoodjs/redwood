import terminalLink from 'terminal-link'

import { sides } from '../lib/project'
import checkForBabelConfig from '../middleware/checkForBabelConfig'

export const command = 'build [side..]'
export const description = 'Build for production'

export const builder = (yargs) => {
  const choices = sides()

  yargs
    .positional('side', {
      choices,
      default: choices,
      description: 'Which side(s) to build',
      type: 'array',
    })
    .option('stats', {
      default: false,
      description: `Use ${terminalLink(
        'Webpack Bundle Analyzer',
        'https://github.com/webpack-contrib/webpack-bundle-analyzer'
      )}`,
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Print more',
      type: 'boolean',
    })
    .option('prerender', {
      default: true,
      description: 'Prerender after building web',
      type: 'boolean',
    })
    .option('prisma', {
      type: 'boolean',
      alias: 'db',
      default: true,
      description: 'Generate the Prisma client',
    })
    .option('performance', {
      alias: 'perf',
      type: 'boolean',
      default: false,
      description: 'Measure build performance',
    })
    .middleware(checkForBabelConfig)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#build'
      )}`
    )
}

export const handler = async (options) => {
  const { handler } = await import('./buildHandler.js')
  return handler(options)
}
