import fs from 'fs'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import rimraf from 'rimraf'
import terminalLink from 'terminal-link'

import { buildApi, loadAndValidateSdls } from '@redwoodjs/internal'
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'
import { timedTelemetry, errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaCommand } from '../lib/generatePrismaClient'
import checkForBabelConfig from '../middleware/checkForBabelConfig'

import { getTasks as getPrerenderTasks } from './prerender'

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
        'https://redwoodjs.com/reference/command-line-interface#build'
      )}`
    )
}

export const handler = async ({
  side = ['api', 'web'],
  verbose = false,
  performance = false,
  stats = false,
  prisma = true,
  prerender,
}) => {
  const rwjsPaths = getPaths()

  if (performance) {
    console.log('Measuring Web Build Performance...')
    execa.sync(
      `yarn cross-env NODE_ENV=production webpack --config ${require.resolve(
        '@redwoodjs/core/config/webpack.perf.js'
      )}`,
      { stdio: 'inherit', shell: true }
    )
    // We do not want to continue building...
    return
  }

  if (stats) {
    console.log('Building Web Stats...')
    execa.sync(
      `yarn cross-env NODE_ENV=production webpack --config ${require.resolve(
        '@redwoodjs/core/config/webpack.stats.js'
      )}`,
      { stdio: 'inherit', shell: true }
    )
    // We do not want to continue building...
    return
  }

  const tasks = [
    side.includes('api') &&
      prisma && {
        title: 'Generating Prisma Client...',
        task: async () => {
          const { cmd, args } = generatePrismaCommand(rwjsPaths.api.dbSchema)
          return execa(cmd, args, {
            stdio: verbose ? 'inherit' : 'pipe',
            shell: true,
            cwd: rwjsPaths.api.base,
          })
        },
      },
    side.includes('api') && {
      title: 'Verifying graphql schema...',
      task: loadAndValidateSdls,
    },
    side.includes('api') && {
      title: 'Building API...',
      task: () => {
        const { errors, warnings } = buildApi()

        if (errors.length) {
          console.error(errors)
        }
        if (warnings.length) {
          console.warn(warnings)
        }
      },
    },
    side.includes('web') && {
      // Clean web
      title: 'Cleaning Web...',
      task: () => {
        rimraf.sync(rwjsPaths.web.dist)
      },
    },
    side.includes('web') && {
      title: 'Building Web...',
      task: () => {
        return execa(
          `yarn cross-env NODE_ENV=production webpack --config ${require.resolve(
            '@redwoodjs/core/config/webpack.production.js'
          )}`,
          {
            stdio: verbose ? 'inherit' : 'pipe',
            shell: true,
            cwd: rwjsPaths.web.base,
          }
        )
      },
    },
    side.includes('web') &&
      prerender && {
        title: 'Prerendering Web...',
        task: async () => {
          const prerenderRoutes = detectPrerenderRoutes()
          if (prerenderRoutes.length === 0) {
            return `You have not marked any "prerender" in your ${terminalLink(
              'Routes',
              'file://' + rwjsPaths.web.routes
            )}.`
          }
          return new Listr(await getPrerenderTasks(), {
            renderer: verbose && VerboseRenderer,
            concurrent: true, // Re-use prerender tasks, but run them in parallel to speed things up
          })
        },
      },
  ].filter(Boolean)

  const jobs = new Listr(tasks, {
    renderer: verbose && VerboseRenderer,
  })

  try {
    await timedTelemetry(process.argv, { type: 'build' }, async () => {
      await jobs.run()
    })
  } catch (e) {
    console.log(c.error(e.message))
    errorTelemetry(process.argv, e.message)
    process.exit(1)
  }
}
