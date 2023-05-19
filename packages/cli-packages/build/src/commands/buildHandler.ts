import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'
import { rimraf } from 'rimraf'
import terminalLink from 'terminal-link'

import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'
// @ts-expect-error - no types
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'

import { generatePrismaCommand } from '../lib/generatePrismaClient'
import { getPaths, getConfig } from '../lib/project'
import { recordTelemetryAttribute } from '../lib/telemetry'
import { BuildYargsOptions } from '../types'

export const handler = async ({
  side = ['api', 'web'],
  verbose = false,
  performance = false,
  stats = false,
  prisma = true,
  prerender,
}: BuildYargsOptions) => {
  // Telemetry
  recordTelemetryAttribute('command', 'build')
  recordTelemetryAttribute('side', JSON.stringify(side))
  recordTelemetryAttribute('verbose', verbose)
  recordTelemetryAttribute('performance', performance)
  recordTelemetryAttribute('stats', stats)
  recordTelemetryAttribute('prisma', prisma)
  recordTelemetryAttribute('prerender', prerender)

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

  const tasks = []
  if (shouldGeneratePrismaClient) {
    tasks.push({
      title: 'Generating Prisma Client...',
      task: async () => {
        const { cmd, args } = generatePrismaCommand(rwjsPaths.api.dbSchema)
        if (cmd === undefined) {
          return
        }
        await execa(cmd, args, {
          stdio: verbose ? 'inherit' : 'pipe',
          shell: true,
          cwd: rwjsPaths.api.base,
        })
      },
    })
  }

  if (side.includes('api')) {
    tasks.push({
      title: 'Verifying graphql schema...',
      task: async () => {
        await loadAndValidateSdls()
      },
    })
    tasks.push({
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
    })
  }

  if (side.includes('web')) {
    tasks.push({
      // Clean web/dist before building
      // Vite handles this internally
      title: 'Cleaning Web...',
      task: () => {
        return rimraf(rwjsPaths.web.dist)
      },
      enabled: getConfig().web.bundler !== 'vite',
    })
    tasks.push({
      title: 'Building Web...',
      task: async () => {
        if (getConfig().web.bundler === 'vite') {
          await buildWeb({
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
    })
  }

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
    renderer: verbose ? 'verbose' : 'default',
  })

  await jobs.run()

  if (side.includes('web') && prerender) {
    // This step is outside Listr so that it prints clearer, complete messages
    await triggerPrerender()
  }
}
