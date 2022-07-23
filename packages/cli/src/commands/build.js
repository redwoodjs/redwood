import fs from 'fs'

import terminalLink from 'terminal-link'

import { getPaths } from '../lib'
import checkForBabelConfig from '../middleware/checkForBabelConfig'

export const command = 'build [side..]'
export const description = 'Build for production'

export const builder = (yargs) => {
  const apiExists = fs.existsSync(getPaths().api.src)
  const webExists = fs.existsSync(getPaths().web.src)

  const optionDefault = (apiExists, webExists) => {
    let options = []
    if (apiExists) {
      options.push('api')
    }
    if (webExists) {
      options.push('web')
    }
    return options
  }

  yargs
    .positional('side', {
      choices: ['api', 'web'],
      default: optionDefault(apiExists, webExists),
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
  const { handler } = await import('./buildHandler')
  return handler(options)
}
