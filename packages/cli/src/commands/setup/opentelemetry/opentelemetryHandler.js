import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { addApiPackages } from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

export const handler = async ({ force, verbose, addPackage }) => {
  const ts = isTypeScriptProject()

  // Used in multiple tasks
  const opentelemetryScriptPath = `${getPaths().api.src}/opentelemetry.${
    ts ? 'ts' : 'js'
  }`

  // TODO: Consider extracting these from the template? Consider version pinning?
  const opentelemetryPackages = [
    '@opentelemetry/api',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-node',
    '@opentelemetry/semantic-conventions',
  ]

  const tasks = new Listr(
    [
      {
        title: 'Confirmation',
        task: async (_ctx, task) => {
          const confirmation = await task.prompt({
            type: 'Confirm',
            message: 'OpenTelemetry support is experimental. Continue?',
          })

          if (!confirmation) {
            throw new Error('User aborted')
          }
        },
      },
      {
        title: `Adding opentelemetry.${ts ? 'ts' : 'js'}...`,
        task: () => {
          const templateContent = fs.readFileSync(
            path.resolve(__dirname, 'templates', 'opentelemetry.ts.template'),
            'utf-8'
          )

          const openTelemetryScriptContent = ts
            ? templateContent
            : transformTSToJS(opentelemetryScriptPath, templateContent)

          return writeFile(
            opentelemetryScriptPath,
            openTelemetryScriptContent,
            {
              overwriteExisting: force,
            }
          )
        },
      },
      {
        title: 'Adding OpenTelemetry setup script path to .env file...',
        task: (_ctx, task) => {
          const envPath = path.join(getPaths().base, '.env')
          const envContent = fs.readFileSync(envPath, 'utf-8')
          if (!envContent.includes('REDWOOD_OPENTELEMETRY_API=')) {
            // Append the setting on a new line with comment above
            writeFile(
              envPath,
              `${envContent}\n# Location of setup script for OpenTelemetry (added by 'rw setup opentelemetry')\nREDWOOD_OPENTELEMETRY_API=${opentelemetryScriptPath}\n`,
              {
                overwriteExisting: true, // We're manually appending so it should be okay
              }
            )
          } else {
            task.skip(
              `"REDWOOD_OPENTELEMETRY_API" is already set in your .env file. Please update it to point to:\n${opentelemetryScriptPath}`
            )
          }
        },
      },
      {
        ...addApiPackages(opentelemetryPackages),
        title: 'Adding @opentelemetry dependencies...',
        skip: () => {
          if (!addPackage) {
            return 'Skipping package install, you will need to add all necessary @opentelemetry packages manaually as a dependency on the api workspace'
          }
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n
          ${c.green('OpenTelemetry Support is still experimental!')}
          ${c.green('Please let us know if you find bugs or quirks.')}
          ${chalk.hex('#e8e8e8')(
            'https://github.com/redwoodjs/redwood/issues/new'
          )}
        `
        },
      },
    ],
    {
      rendererOptions: { collapse: false },
      renderer: verbose ? 'verbose' : 'default',
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
