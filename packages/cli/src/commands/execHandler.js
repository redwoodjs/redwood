import fs from 'node:fs'
import path from 'node:path'

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
  // Loop through all scripts and get their relative path
  // Also group scripts with the same name but different extensions
  const scripts = findScripts(getPaths().scripts).reduce((acc, scriptPath) => {
    const relativePath = path.relative(getPaths().scripts, scriptPath)
    const ext = path.parse(relativePath).ext
    const pathNoExt = relativePath.slice(0, -ext.length)

    acc[pathNoExt] ||= []
    acc[pathNoExt].push(relativePath)

    return acc
  }, {})

  console.log('Available scripts:')
  Object.entries(scripts).forEach(([name, paths]) => {
    // If a script name exists with multiple extensions, print them all,
    // including the extension
    if (paths.length > 1) {
      paths.forEach((scriptPath) => {
        console.log(c.info(`- ${scriptPath}`))
      })
    } else {
      console.log(c.info(`- ${name}`))
    }
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

  const scriptPath = resolveScriptPath(name)

  if (!scriptPath) {
    console.error(
      c.error(`\nNo script called \`${name}\` in the ./scripts folder.\n`),
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
    renderer: args.silent ? 'silent' : 'verbose',
  })

  // Prevent user project telemetry from within the script from being recorded
  await context.with(suppressTracing(context.active()), async () => {
    await tasks.run()
  })
}

function resolveScriptPath(name) {
  const scriptPath = path.join(getPaths().scripts, name)

  // If scriptPath already has an extension, and it's a valid path, return it
  // as it is
  if (fs.existsSync(scriptPath)) {
    return scriptPath
  }

  // These extensions match the ones in internal/src/files.ts::findScripts()
  const extensions = ['.js', '.jsx', '.ts', '.tsx']
  const matches = []

  for (const extension of extensions) {
    const p = scriptPath + extension

    if (fs.existsSync(p)) {
      matches.push(p)
    }
  }

  if (matches.length === 1) {
    return matches[0]
  } else if (matches.length > 1) {
    console.error(
      c.error(
        `\nMultiple scripts found for \`${name}\`. Please specify the ` +
          'extension.',
      ),
    )

    matches.forEach((match) => {
      console.log(c.info(`- ${path.relative(getPaths().scripts, match)}`))
    })

    process.exit(1)
  }

  return null
}
