import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'
import rimraf from 'rimraf'

import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'
import { errorTelemetry, timedTelemetry } from '@redwoodjs/telemetry'
import { buildFeServer } from '@redwoodjs/vite'

import { getConfig, getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaCommand } from '../lib/generatePrismaClient'

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
      { stdio: 'inherit', shell: true, cwd: rwjsPaths.web.base }
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
      { stdio: 'inherit', shell: true, cwd: rwjsPaths.web.base }
    )
    // We do not want to continue building...
    return
  }

  const prerenderRoutes =
    prerender && side.includes('web') ? detectPrerenderRoutes() : []
  const shouldGeneratePrismaClient =
    prisma && (side.includes('api') || prerenderRoutes.length > 0)

  const tasks = [
    shouldGeneratePrismaClient && {
      title: 'Generating Prisma Client...',
      task: () => {
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
      // Clean web/dist before building
      // Vite handles this internally
      title: 'Cleaning Web...',
      task: () => {
        return rimraf(rwjsPaths.web.dist)
      },
      enabled: getConfig().web.bundler !== 'vite',
    },
    side.includes('web') && {
      title: 'Building Web...',
      task: async () => {
        if (getConfig().web.bundler === 'vite') {
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          // @WARN DO NOT MERGE TEMPORARY HACK
          process.chdir(rwjsPaths.web.base)

          // @TODO: we need to use a binary here, so the the cwd is correct
          await buildFeServer({
            verbose,
          })
        } else {
          await execa(
            `yarn cross-env NODE_ENV=production webpack --config ${require.resolve(
              '@redwoodjs/core/config/webpack.production.js'
            )}`,
            {
              stdio: verbose ? 'inherit' : 'pipe',
              shell: true,
              cwd: rwjsPaths.web.base,
            }
          )
        }

        console.log('Creating 200.html...')

        const indexHtmlPath = path.join(getPaths().web.dist, 'index.html')

        fs.copyFileSync(
          indexHtmlPath,
          path.join(getPaths().web.dist, '200.html')
        )
      },
    },
  ].filter(Boolean)

  const jobs = new Listr(tasks, {
    renderer: verbose && 'verbose',
  })

  try {
    await timedTelemetry(process.argv, { type: 'build' }, async () => {
      await jobs.run()

      // Removing prerender for streaming setup
      // if (side.includes('web') && prerender) {
      //   // This step is outside Listr so that it prints clearer, complete messages
      //   await triggerPrerender()
      // }
    })
  } catch (e) {
    console.log(c.error(e.message))
    errorTelemetry(process.argv, e.message)
    process.exit(1)
  }
}
