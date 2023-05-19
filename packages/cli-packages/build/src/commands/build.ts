import terminalLink from 'terminal-link'

import checkForBabelConfig from '../lib/checkForBabelConfig'
import c from '../lib/colors'
import { sides } from '../lib/project'
import { BuildYargsOptions } from '../types'

export const command = 'build [side..]'
export const description = 'Build for production'

export const defaults: BuildYargsOptions = {
  side: sides(),
  stats: false,
  verbose: false,
  prerender: true,
  prisma: true,
  performance: false,
}

// TODO: Type this 'any' properly
export const builder = (yargsInstance: any) => {
  const choices = sides()

  yargsInstance
    .positional('side', {
      choices,
      default: defaults['side'],
      description: 'Which side(s) to build',
      type: 'array',
    })
    .option('stats', {
      default: defaults['stats'],
      description: `Use ${terminalLink(
        'Webpack Bundle Analyzer',
        'https://github.com/webpack-contrib/webpack-bundle-analyzer'
      )}`,
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: defaults['verbose'],
      description: 'Print more',
      type: 'boolean',
    })
    .option('prerender', {
      default: defaults['prerender'],
      description: 'Prerender after building web',
      type: 'boolean',
    })
    .option('prisma', {
      type: 'boolean',
      alias: 'db',
      default: defaults['prisma'],
      description: 'Generate the Prisma client',
    })
    .option('performance', {
      alias: 'perf',
      type: 'boolean',
      default: defaults['performance'],
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

export const handler = async (options: BuildYargsOptions) => {
  // TODO: This initial output should be prettier
  console.log(c.green("Starting 'build' command..."))
  const { handler } = await import('./buildHandler.js')
  await handler(options)
}
