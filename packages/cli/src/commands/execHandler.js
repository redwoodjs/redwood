import path from 'path'

import { context } from '@opentelemetry/api'
import { suppressTracing } from '@opentelemetry/core'
import { Listr } from 'listr2'

import {
  getWebSideDefaultBabelConfig,
  registerApiSideBabelHook,
} from '@redwoodjs/babel-config'
import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { findScripts } from '@redwoodjs/internal/dist/files'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { runScriptFunction } from '../lib/exec'
import { generatePrismaClient } from '../lib/generatePrismaClient'

const printAvailableScriptsToConsole = () => {
  console.log('Available scripts:')
  findScripts().forEach((scriptPath) => {
    const { name } = path.parse(scriptPath)
    console.log(c.info(`- ${name}`))
  })
  console.log()
}

export const handler = async (args) => {
  recordTelemetryAttributes({
    command: 'exec',
    prisma: args.prisma,
    list: args.list,
  })

  const { name, prisma, list, ...scriptArgs } = args
  if (list || !name) {
    printAvailableScriptsToConsole()
    return
  }

  const scriptPath = path.join(getPaths().scripts, name)

  const {
    overrides: _overrides,
    plugins: webPlugins,
    ...otherWebConfig
  } = getWebSideDefaultBabelConfig()

  // Import babel config for running script
  registerApiSideBabelHook({
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            $api: getPaths().api.base,
            $web: getPaths().web.base,
            api: getPaths().api.base,
            web: getPaths().web.base,
          },
          loglevel: 'silent', // to silence the unnecessary warnings
        },
        'exec-$side-module-resolver',
      ],
    ],
    overrides: [
      {
        test: ['./api/'],
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src: getPaths().api.src,
              },
              loglevel: 'silent',
            },
            'exec-api-src-module-resolver',
          ],
        ],
      },
      {
        test: ['./web/'],
        plugins: [
          ...webPlugins,
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src: getPaths().web.src,
              },
              loglevel: 'silent',
            },
            'exec-web-src-module-resolver',
          ],
        ],
        ...otherWebConfig,
      },
    ],
  })

  try {
    require.resolve(scriptPath)
  } catch {
    console.error(
      c.error(`\nNo script called ${c.underline(name)} in ./scripts folder.\n`)
    )

    printAvailableScriptsToConsole()
    process.exit(1)
  }

  const scriptTasks = [
    {
      title: 'Generating Prisma client',
      enabled: () => prisma,
      task: () => generatePrismaClient({ force: false }),
    },
    {
      title: 'Running script',
      task: async () => {
        try {
          await runScriptFunction({
            path: scriptPath,
            functionName: 'default',
            args: { args: scriptArgs },
          })
        } catch (e) {
          console.error(c.error(`Error in script: ${e.message}`))
          throw e
        }
      },
    },
  ]

  const tasks = new Listr(scriptTasks, {
    rendererOptions: { collapseSubtasks: false },
    renderer: 'verbose',
  })

  // Prevent user project telemetry from within the script from being recorded
  await context.with(suppressTracing(context.active()), async () => {
    await tasks.run()
  })
}
