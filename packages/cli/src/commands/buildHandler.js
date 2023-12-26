import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import { rimraf } from 'rimraf'
import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'
import { timedTelemetry } from '@redwoodjs/telemetry'

import { getPaths, getConfig } from '../lib'
import { generatePrismaCommand } from '../lib/generatePrismaClient'

export const handler = async ({
  side = ['api', 'web'],
  verbose = false,
  performance = false,
  stats = false,
  prisma = true,
  prerender,
}) => {
  recordTelemetryAttributes({
    command: 'build',
    side: JSON.stringify(side),
    verbose,
    performance,
    stats,
    prisma,
    prerender,
  })
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
      enabled: getConfig().web.bundler === 'webpack',
    },
    side.includes('web') && {
      title: 'Building Web...',
      task: async () => {
        if (getConfig().web.bundler !== 'webpack') {
          // @NOTE: we're using the vite build command here, instead of the
          // buildWeb function directly because we want the process.cwd to be
          // the web directory, not the root of the project.
          // This is important for postcss/tailwind to work correctly
          // Having a separate binary lets us contain the change of cwd to that
          // process only. If we changed cwd here, or in the buildWeb function,
          // it could affect other things that run in parallel while building.
          // We don't have any parallel tasks right now, but someone might add
          // one in the future as a performance optimization.
          await execa(
            `node ${require.resolve(
              '@redwoodjs/vite/bins/rw-vite-build.mjs'
            )} --webDir="${rwjsPaths.web.base}" --verbose=${verbose}`,
            {
              stdio: verbose ? 'inherit' : 'pipe',
              shell: true,
              // `cwd` is needed for yarn to find the rw-vite-build binary
              // It won't change process.cwd for anything else here, in this
              // process
              cwd: rwjsPaths.web.base,
            }
          )
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

        // Streaming SSR does not use the index.html file.
        if (!getConfig().experimental?.streamingSsr?.enabled) {
          console.log('Creating 200.html...')

          const indexHtmlPath = path.join(getPaths().web.dist, 'index.html')

          fs.copyFileSync(
            indexHtmlPath,
            path.join(getPaths().web.dist, '200.html')
          )
        }
      },
    },
  ].filter(Boolean)

  const triggerPrerender = async () => {
    console.log('Starting prerendering...')
    if (prerenderRoutes.length === 0) {
      console.log(
        `You have not marked any routes to "prerender" in your ${terminalLink(
          'Routes',
          'file://' + rwjsPaths.web.routes
        )}.`
      )
    }
    // Running a separate process here, otherwise it wouldn't pick up the
    // generated Prisma Client due to require module caching
    await execa('yarn rw prerender', {
      stdio: 'inherit',
      shell: true,
      cwd: rwjsPaths.web.base,
    })
  }

  const jobs = new Listr(tasks, {
    renderer: verbose && 'verbose',
  })

  await timedTelemetry(process.argv, { type: 'build' }, async () => {
    await jobs.run()

    if (side.includes('web') && prerender) {
      // This step is outside Listr so that it prints clearer, complete messages
      await triggerPrerender()
    }
  })
}
